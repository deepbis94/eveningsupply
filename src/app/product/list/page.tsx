'use client'

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ProductEditModal from '@/components/product/ProductEditModal'
import CommonModal from '@/components/shared/CommonModal'
import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import PageHeader from '@/components/shared/PageHeader'
import {
  createProduct,
  deleteProduct,
  exportProductsCsv,
  getProducts,
  importProductsCsv,
  updateProduct,
} from '@/lib/api/products'
import { downloadBlob, getExportFileName } from '@/lib/utils/download'
import { formatRateValue } from '@/lib/utils/roundAmount'
import { toast } from '@/lib/utils/toast'
import type { Product } from '@/types/Product'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

function ProductListContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') ?? '')
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
  const [perPage, setPerPage] = useState(Number(searchParams.get('per_page')) || 10)
  const [totalItems, setTotalItems] = useState(0)
  const [lastPage, setLastPage] = useState(1)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productIdToDelete, setProductIdToDelete] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pendingImportModeRef = useRef<'upsert' | 'reset'>('upsert')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateRouteQuery = useCallback(
    (next: { page?: number; per_page?: number; q?: string }) => {
      const page = next.page ?? currentPage
      const limit = next.per_page ?? perPage
      const q = next.q !== undefined ? next.q : searchTerm.trim()

      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('per_page', String(limit))
      if (q) params.set('q', q)

      router.replace(`${pathname}?${params.toString()}`)
    },
    [currentPage, perPage, searchTerm, pathname, router]
  )

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      const page = Number(searchParams.get('page')) || 1
      const limit = Number(searchParams.get('per_page')) || 10
      const q = (searchParams.get('q') ?? '').trim()

      setCurrentPage(page)
      setPerPage(limit)
      setSearchTerm(q)

      const response = await getProducts({
        page,
        perPage: limit,
        q: q || undefined,
      })

      const data = response.data ?? []
      const pagination = response.pagination

      setProducts(
        data.map((p: Product) => ({
          ...p,
          id: p.product_id,
          product_id: p.product_id,
          name: p.product_name,
          product_name: p.product_name,
          quantity: p.product_quantity,
          product_quantity: p.product_quantity,
          product_rate: formatRateValue(p.product_rate),
          is_visible: p.is_visible ?? 'No',
          order: p.order,
          color: p.color ?? '#ffffff',
        }))
      )

      if (pagination) {
        setCurrentPage(Number(pagination.current_page) || page)
        setLastPage(Number(pagination.last_page) || 1)
        setPerPage(Number(pagination.per_page) || limit)
        setTotalItems(Number(pagination.total) || 0)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  function goToPage(page: number) {
    if (page < 1 || page > lastPage || page === currentPage) return
    updateRouteQuery({ page })
  }

  function goToPageNum(perPageValue: number) {
    if (perPageValue <= 0) return
    setPerPage(perPageValue)
    updateRouteQuery({ page: 1, per_page: perPageValue })
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      updateRouteQuery({ page: 1, q: value.trim() })
    }, 300)
  }

  function editProduct(item: Product) {
    if (!item) return
    setSelectedProduct({
      id: item.id ?? item.product_id ?? 0,
      product_id: item.product_id ?? item.id ?? 0,
      name: item.name ?? item.product_name ?? '',
      product_name: item.product_name ?? item.name ?? '',
      quantity: item.quantity ?? item.product_quantity ?? '',
      product_quantity: item.product_quantity ?? item.quantity ?? '',
      product_rate: formatRateValue(item.product_rate),
      is_visible: item.is_visible ?? 'No',
      order: item.order ?? 0,
      color: item.color ?? '#ffffff',
    })
    setShowEditModal(true)
  }

  function openAddModal() {
    setSelectedProduct(null)
    setShowEditModal(true)
  }

  function closeEditModal() {
    setShowEditModal(false)
    setTimeout(() => setSelectedProduct(null), 300)
  }

  function openDeleteModal(id: number | undefined) {
    if (id == null) return
    setProductIdToDelete(id)
    setShowDeleteModal(true)
  }

  function closeDeleteModal() {
    setShowDeleteModal(false)
    setTimeout(() => setProductIdToDelete(null), 300)
  }

  function buildProductPayload(updated: Product) {
    return {
      product_name: updated.name,
      product_quantity: updated.quantity,
      color: updated.color,
      p_order: updated.order,
      product_rate: Number(updated.product_rate) || 0,
      is_visible: updated.is_visible === 'Yes',
    }
  }

  async function saveProduct(updated: Product) {
    const payload = buildProductPayload(updated)

    try {
      setIsLoading(true)
      if (updated.id === 0) {
        await createProduct(payload)
        toast.success('Product added')
      } else {
        await updateProduct(updated.id ?? updated.product_id, payload)
        toast.success('Product updated')
      }
      closeEditModal()
      await fetchProducts()
    } catch (error) {
      console.error('Failed to save product:', error)
      toast.error(updated.id === 0 ? 'Failed to add product' : 'Failed to update product')
    } finally {
      setIsLoading(false)
    }
  }

  async function confirmDelete() {
    const id = productIdToDelete
    if (id === null) return

    try {
      await deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id && p.product_id !== id))
      closeDeleteModal()
      toast.success('Product deleted')
    } catch (error) {
      console.error('Failed to delete product:', error)
      toast.error('Failed to delete product')
    }
  }

  async function exportProducts() {
    try {
      const res = await exportProductsCsv()
      downloadBlob(
        res.data,
        getExportFileName(res.headers['content-disposition'], 'products-evening.csv'),
        'text/csv;charset=utf-8;'
      )
      toast.success('Export successful')
    } catch (err) {
      console.error(err)
      toast.error('Export failed')
    }
  }

  function triggerImport(mode: 'upsert' | 'reset' = 'upsert') {
    if (mode === 'reset') {
      const ok = window.confirm(
        'Reset will replace ALL products with the CSV file and delete any products missing from the file. Continue?'
      )
      if (!ok) return
    }

    pendingImportModeRef.current = mode
    fileInputRef.current?.click()
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const target = event.target
    if (!target.files || target.files.length === 0) return

    const mode = pendingImportModeRef.current
    const formData = new FormData()
    formData.append('file', target.files[0])

    try {
      const res = await importProductsCsv(formData, mode)
      const result = (res.data as { data?: { imported?: number; deleted?: number } })?.data
      const deleted = result?.deleted ?? 0

      if (mode === 'reset') {
        toast.info(`Reset complete: ${result?.imported ?? 0} imported, ${deleted} deleted`)
      } else {
        toast.success('Import successful')
      }
      await fetchProducts()
    } catch (err) {
      console.error(err)
      toast.error(mode === 'reset' ? 'Reset failed' : 'Import failed')
    }

    target.value = ''
    pendingImportModeRef.current = 'upsert'
  }

  return (
    <div>
      <div className="container">
        <PageHeader title="Product List" subtitle="Add, edit, delete, search, and paginate products.">
          <div className="d-flex gap-2 flex-wrap">
            <button type="button" className="btn btn-warning" onClick={exportProducts}>
              <i className="fa-solid fa-download" /> Export CSV
            </button>
            <button type="button" className="btn btn-success" onClick={() => triggerImport('upsert')}>
              <i className="fa-solid fa-upload" /> Import CSV
            </button>
            <button type="button" className="btn btn-outline-danger" onClick={() => triggerImport('reset')}>
              <i className="fa-solid fa-rotate" /> Import & Reset CSV
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button type="button" className="btn btn-primary" onClick={openAddModal}>
              Add Product
            </button>
          </div>
        </PageHeader>

        <div className="mt-2">
          <input
            className="form-control"
            placeholder="Search products..."
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>

        <br />

        <div id="home">
          {isLoading ? (
            <LoadingState message="Loading products..." />
          ) : products.length === 0 ? (
            <EmptyState title="No products found" />
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Display</th>
                    <th>Order</th>
                    <th>Color</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(item => (
                      <tr key={item.product_id}>
                        <td>{item.id ?? item.product_id}</td>
                        <td>{item.name ?? item.product_name}</td>
                        <td>{item.quantity ?? item.product_quantity}</td>
                        <td>{item.product_rate}</td>
                        <td>{item.is_visible}</td>
                        <td>{item.order}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6 }}>
                            <div
                              style={{
                                width: 28,
                                height: 20,
                                background: item.color || '#ffffff',
                                border: '1px solid #ccc',
                              }}
                            />
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, padding: 6 }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => editProduct(item)}
                            >
                              <i className="fa-solid fa-pencil" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => openDeleteModal(item.id ?? item.product_id)}
                            >
                              <i className="fa-solid fa-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          <div
            className="mt-4 mb-4 d-flex flex-wrap justify-content-between align-items-center gap-3"
          >
            <div className="d-flex flex-wrap align-items-center gap-3 justify-content-center">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span className="text-muted">
                Page {currentPage} of {lastPage} · {totalItems} total
              </span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === lastPage}
              >
                Next
              </button>
            </div>
            <label className="d-flex align-items-center gap-2 mb-0">
              <span>Limit</span>
              <select
                className="form-select form-select-sm"
                value={perPage}
                onChange={e => goToPageNum(Number(e.target.value))}
                style={{ width: 'auto' }}
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <ProductEditModal
        product={selectedProduct}
        show={showEditModal}
        onClose={closeEditModal}
        onSave={saveProduct}
      />

      <CommonModal
        show={showDeleteModal}
        title="Delete Product"
        onClose={closeDeleteModal}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete}>
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this product?</p>
      </CommonModal>
    </div>
  )
}

export default function ProductListPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading products..." />}>
      <ProductListContent />
    </Suspense>
  )
}
