'use client'

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import CommonModal from '@/components/shared/CommonModal'
import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import PageHeader from '@/components/shared/PageHeader'
import {
  createEveningCustomer,
  deleteEveningCustomer,
  exportEveningCustomersCsv,
  getEveningCustomers,
  importEveningCustomersCsv,
  updateEveningCustomer,
} from '@/lib/api/customers'
import { getCustomerGroups } from '@/lib/api/customerGroups'
import { formatShortUpdatedAt, formatUpdatedAtTitle } from '@/lib/utils/dateLabels'
import { downloadBlob, getExportFileName } from '@/lib/utils/download'
import { formatRateValue, toMoneyAmount } from '@/lib/utils/roundAmount'
import { toast } from '@/lib/utils/toast'
import type { CustomerGroup } from '@/types/CustomerGroup'
import type { EveningCustomer } from '@/types/EveningCustomer'

const RECORDS_PER_PAGE = 50

function CustomerListContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [customers, setCustomers] = useState<EveningCustomer[]>([])
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [customerSearch, setCustomerSearch] = useState(searchParams.get('q') ?? '')
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>(
    Number(searchParams.get('customer_group_id')) || ''
  )
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
  const [perPage, setPerPage] = useState(Number(searchParams.get('per_page')) || RECORDS_PER_PAGE)
  const [totalItems, setTotalItems] = useState(0)
  const [lastPage, setLastPage] = useState(1)

  const [selectedCustomer, setSelectedCustomer] = useState<EveningCustomer | null>(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [customerIdToDelete, setCustomerIdToDelete] = useState<number | null>(null)
  const [customerMode, setCustomerMode] = useState<'add' | 'edit'>('add')
  const [customerForm, setCustomerForm] = useState({
    customer_name: '',
    group_id: null as number | null,
    group_name: '',
    due: 0 as number | string,
  })
  const [customerErrors, setCustomerErrors] = useState({ customer_name: '' })

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pendingImportModeRef = useRef<'upsert' | 'reset'>('upsert')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pageSizeOptions = useMemo(() => {
    const total = totalItems
    if (total <= 0) return [RECORDS_PER_PAGE]

    const options: number[] = []
    for (let size = RECORDS_PER_PAGE; size < total; size += RECORDS_PER_PAGE) {
      options.push(size)
    }
    if (!options.includes(total)) options.push(total)
    return options
  }, [totalItems])

  const updateRouteQuery = useCallback(
    (next?: {
      page?: number
      per_page?: number
      q?: string
      customer_group_id?: number | ''
    }) => {
      const page = next?.page ?? currentPage
      const limit = next?.per_page ?? perPage
      const q = next?.q !== undefined ? next.q : customerSearch.trim()
      const groupId = next?.customer_group_id !== undefined ? next.customer_group_id : selectedGroupId

      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('per_page', String(limit))
      if (q) params.set('q', q)
      if (groupId) params.set('customer_group_id', String(groupId))

      router.replace(`${pathname}?${params.toString()}`)
    },
    [currentPage, perPage, customerSearch, selectedGroupId, pathname, router]
  )

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true)

      const page = Number(searchParams.get('page')) || 1
      const limit = Number(searchParams.get('per_page')) || RECORDS_PER_PAGE
      const q = (searchParams.get('q') ?? '').trim()
      const groupId = Number(searchParams.get('customer_group_id')) || 0

      setCurrentPage(page)
      setPerPage(limit > 0 ? limit : RECORDS_PER_PAGE)
      setCustomerSearch(q)
      setSelectedGroupId(groupId > 0 ? groupId : '')

      const res = await getEveningCustomers({
        page,
        perPage: limit > 0 ? limit : RECORDS_PER_PAGE,
        q: q || undefined,
        customerGroupId: groupId > 0 ? groupId : undefined,
      })

      const data = res.data ?? []
      const pagination = res.pagination

      setCustomers(
        data.map((c: EveningCustomer) => ({
          customer_id: c.customer_id,
          customer_name: c.customer_name,
          group: c.group ?? '',
          customer_group_id: c.customer_group_id ?? null,
          due: formatRateValue(c.due ?? 0),
          created_at: c.created_at,
          updated_at: c.updated_at,
        }))
      )

      if (pagination) {
        setCurrentPage(Number(pagination.current_page) || page)
        setTotalItems(Number(pagination.total) || 0)
        const total = Number(pagination.total) || 0
        setLastPage(
          Number(pagination.last_page) || Math.max(1, Math.ceil(total / (limit || RECORDS_PER_PAGE)))
        )
      }
    } catch (err) {
      console.error('Failed to load evening customers', err)
      toast.error('Failed to load evening customers')
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])

  const fetchCustomerGroups = useCallback(async () => {
    try {
      setCustomerGroups(await getCustomerGroups())
    } catch (err) {
      console.error('Failed to load customer groups', err)
    }
  }, [])

  useEffect(() => {
    void fetchCustomerGroups()
  }, [fetchCustomerGroups])

  useEffect(() => {
    void fetchCustomers()
  }, [fetchCustomers])

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
    setCustomerSearch(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      updateRouteQuery({ page: 1, q: value.trim() })
    }, 300)
  }

  function getGroupNameById(groupId: number | null) {
    return customerGroups.find(g => g.customer_group_id === groupId)?.group_name ?? ''
  }

  function openCustomerModal(mode: 'add' | 'edit', customer: EveningCustomer | null = null) {
    setCustomerMode(mode)
    if (mode === 'edit' && customer) {
      setSelectedCustomer(customer)
      setCustomerForm({
        customer_name: customer.customer_name,
        group_id: customer.customer_group_id,
        group_name: customer.group,
        due: customer.due,
      })
    } else {
      setSelectedCustomer(null)
      setCustomerForm({
        customer_name: '',
        group_id: null,
        group_name: '',
        due: 0,
      })
    }
    setCustomerErrors({ customer_name: '' })
    setShowCustomerModal(true)
  }

  function closeCustomerModal() {
    setShowCustomerModal(false)
  }

  function openDeleteModal(customerId: number | undefined) {
    if (customerId == null) return
    setCustomerIdToDelete(customerId)
    setShowDeleteModal(true)
  }

  function closeDeleteModal() {
    setShowDeleteModal(false)
    setTimeout(() => setCustomerIdToDelete(null), 300)
  }

  async function confirmDeleteCustomer() {
    const id = customerIdToDelete
    if (id == null) return

    try {
      await deleteEveningCustomer(id)
      setCustomers(prev => prev.filter(c => c.customer_id !== id))
      toast.success('Customer deleted')
      closeDeleteModal()
    } catch (err) {
      console.error('Failed to delete customer', err)
      toast.error('Failed to delete customer')
    }
  }

  function validateCustomerName(name = customerForm.customer_name) {
    const error = name.trim() ? '' : 'Customer name is required'
    setCustomerErrors({ customer_name: error })
    return error
  }

  async function saveCustomer() {
    const nameError = validateCustomerName()
    if (nameError) {
      toast.error('Please fix customer validation errors')
      return
    }

    try {
      const selectedGroupName = getGroupNameById(customerForm.group_id)
      const payload = {
        customer_name: customerForm.customer_name,
        customer_group_id: customerForm.group_id,
        due_amount: toMoneyAmount(customerForm.due),
      }
      const groupName = selectedGroupName || customerForm.group_name

      if (customerMode === 'add') {
        const res = await createEveningCustomer(payload)
        const created = (res.data as { data?: EveningCustomer })?.data
        setCustomers(prev => [
          created ?? {
            customer_id: Date.now(),
            customer_name: customerForm.customer_name,
            group: groupName,
            customer_group_id: customerForm.group_id,
            due: customerForm.due,
            created_at: null,
            updated_at: null,
          },
          ...prev,
        ])
        toast.success('Customer added')
      } else if (selectedCustomer) {
        await updateEveningCustomer(selectedCustomer.customer_id, payload)
        setCustomers(prev =>
          prev.map(c =>
            c.customer_id === selectedCustomer.customer_id
              ? {
                  ...c,
                  customer_name: payload.customer_name,
                  group: groupName,
                  customer_group_id: customerForm.group_id,
                  due: customerForm.due,
                  updated_at: new Date().toISOString(),
                }
              : c
          )
        )
        toast.success('Customer updated')
      }

      closeCustomerModal()
      await fetchCustomers()
    } catch (err) {
      console.error('Failed to save customer', err)
      toast.error('Failed to save customer')
    }
  }

  async function exportCustomers() {
    try {
      const res = await exportEveningCustomersCsv()
      downloadBlob(
        res.data,
        getExportFileName(res.headers['content-disposition'], 'evening-customers.csv'),
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
        'Reset will replace ALL customers with the CSV file and delete any customers missing from the file (bills may cascade). Continue?'
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
      const res = await importEveningCustomersCsv(formData, mode)
      const result = (res.data as { data?: { imported?: number; deleted?: number } })?.data
      const deleted = result?.deleted ?? 0

      if (mode === 'reset') {
        toast.info(`Reset complete: ${result?.imported ?? 0} imported, ${deleted} deleted`)
      } else {
        toast.success('Import successful')
      }
      await fetchCustomers()
    } catch (err) {
      console.error(err)
      toast.error(mode === 'reset' ? 'Reset failed' : 'Import failed')
    }

    target.value = ''
    pendingImportModeRef.current = 'upsert'
  }

  return (
    <div className="container">
      <PageHeader title="Evening Customers" subtitle="Add, edit, delete, import, and export customers.">
        <span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openCustomerModal('add')}
            style={{ marginRight: '0.5rem' }}
          >
            Add Customer
          </button>
          <button
            type="button"
            className="btn btn-warning"
            style={{ marginRight: '0.5rem' }}
            onClick={exportCustomers}
          >
            <i className="fa-solid fa-download" /> Export CSV
          </button>
          <button
            type="button"
            className="btn btn-success"
            style={{ marginRight: '0.5rem' }}
            onClick={() => triggerImport('upsert')}
          >
            <i className="fa-solid fa-upload" /> Import CSV
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => triggerImport('reset')}
          >
            <i className="fa-solid fa-rotate" /> Import & Reset CSV
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </span>
      </PageHeader>

      <div className="mb-3 row g-2">
        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Search customer by id or name"
            value={customerSearch}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={selectedGroupId}
            onChange={e => {
              const value = e.target.value ? Number(e.target.value) : ''
              setSelectedGroupId(value)
              updateRouteQuery({ page: 1, customer_group_id: value })
            }}
          >
            <option value="">All Groups</option>
            {customerGroups.map(group => (
              <option key={group.customer_group_id} value={group.customer_group_id}>
                {group.group_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading customers..." />
      ) : customers.length === 0 ? (
        <EmptyState title="No customers found" />
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Group</th>
                <th>Due</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(item => (
                  <tr key={item.customer_id}>
                    <td>{item.customer_id}</td>
                    <td>{item.customer_name}</td>
                    <td>{item.group}</td>
                    <td>{item.due}</td>
                    <td
                      className="text-nowrap text-muted small"
                      title={formatUpdatedAtTitle(item.updated_at)}
                    >
                      {formatShortUpdatedAt(item.updated_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openCustomerModal('edit', item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => openDeleteModal(item.customer_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 mb-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
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
            value={pageSizeOptions.includes(perPage) ? perPage : RECORDS_PER_PAGE}
            onChange={e => goToPageNum(Number(e.target.value))}
            style={{ width: 'auto' }}
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <CommonModal
        show={showCustomerModal}
        title={customerMode === 'add' ? 'Add Customer' : 'Edit Customer'}
        onClose={closeCustomerModal}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={closeCustomerModal}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={saveCustomer}
              disabled={!customerForm.customer_name.trim()}
            >
              Save
            </button>
          </>
        }
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            void saveCustomer()
          }}
        >
          <div className="mb-3">
            <label className="form-label">Customer Name</label>
            <input
              className="form-control"
              value={customerForm.customer_name}
              onChange={e => {
                const value = e.target.value
                setCustomerForm(prev => ({ ...prev, customer_name: value }))
                validateCustomerName(value)
              }}
            />
            {customerErrors.customer_name ? (
              <div className="text-danger small mt-1">{customerErrors.customer_name}</div>
            ) : null}
          </div>
          <div className="mb-3">
            <label className="form-label">Group</label>
            <select
              className="form-select"
              value={customerForm.group_id ?? ''}
              onChange={e =>
                setCustomerForm(prev => ({
                  ...prev,
                  group_id: e.target.value ? Number(e.target.value) : null,
                }))
              }
            >
              <option value="">Select group</option>
              {customerGroups.map(group => (
                <option key={group.customer_group_id} value={group.customer_group_id}>
                  {group.group_name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Due</label>
            <input
              className="form-control"
              type="number"
              step="any"
              min={0}
              value={customerForm.due}
              onChange={e => setCustomerForm(prev => ({ ...prev, due: e.target.value }))}
            />
          </div>
        </form>
      </CommonModal>

      <CommonModal
        show={showDeleteModal}
        title="Delete Customer"
        onClose={closeDeleteModal}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmDeleteCustomer}>
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this customer?</p>
      </CommonModal>
    </div>
  )
}

export default function CustomerListPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading customers..." />}>
      <CustomerListContent />
    </Suspense>
  )
}
