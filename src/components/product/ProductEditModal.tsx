'use client'

import { useEffect, useMemo, useState } from 'react'
import CommonModal from '@/components/shared/CommonModal'
import { getProduct } from '@/lib/api/products'
import { formatRateValue } from '@/lib/utils/roundAmount'
import type { Product } from '@/types/Product'

type Props = {
  product: Product | null
  show: boolean
  onClose: () => void
  onSave: (product: Product) => void
}

function defaultProduct(): Product {
  return {
    id: 0,
    product_id: 0,
    name: '',
    product_name: '',
    quantity: '',
    product_quantity: '',
    product_rate: 0,
    is_visible: 'Yes',
    color: '#ffffff',
    order: 0,
  }
}

export default function ProductEditModal({ product, show, onClose, onSave }: Props) {
  const [editProduct, setEditProduct] = useState<Product>(defaultProduct())
  const isAddMode = useMemo(() => product === null, [product])

  useEffect(() => {
    if (!show) return

    if (product === null) {
      setEditProduct(defaultProduct())
      return
    }

    if (product.name !== undefined) {
      setEditProduct({
        ...product,
        product_rate: formatRateValue(product.product_rate ?? product.basic_rate),
      })
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const res = await getProduct(product.id ?? product.product_id)
        const x = Array.isArray(res?.data) ? res.data[0] : res?.data ?? res
        if (cancelled) return
        setEditProduct({
          id: x.product_id,
          product_id: x.product_id,
          name: x.product_name,
          product_name: x.product_name,
          quantity: x.product_quantity,
          product_quantity: x.product_quantity,
          product_rate: formatRateValue(x.product_rate),
          is_visible: x.is_visible ? 'Yes' : 'No',
          color: x.color ?? '#ffffff',
          order: x.p_order ?? x.order ?? 0,
        })
      } catch (err) {
        console.error('Failed to load product details:', err)
        if (!cancelled) setEditProduct(defaultProduct())
      }
    })()

    return () => {
      cancelled = true
    }
  }, [show, product])

  function close() {
    setEditProduct(defaultProduct())
    onClose()
  }

  function handleSave() {
    onSave({ ...editProduct })
    close()
  }

  function updateField<K extends keyof Product>(key: K, value: Product[K]) {
    setEditProduct(prev => ({ ...prev, [key]: value }))
  }

  return (
    <CommonModal
      show={show}
      title={isAddMode ? 'Add Product' : 'Edit Product'}
      onClose={close}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={close}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </>
      }
    >
      <form
        onSubmit={e => {
          e.preventDefault()
          handleSave()
        }}
      >
        <div className="mb-2">
          <label className="form-label">Name</label>
          <input
            className="form-control"
            value={editProduct.name ?? ''}
            onChange={e => updateField('name', e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Quantity</label>
          <input
            className="form-control"
            value={editProduct.quantity ?? ''}
            onChange={e => updateField('quantity', e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Rate</label>
          <input
            type="number"
            step="any"
            className="form-control"
            value={editProduct.product_rate ?? 0}
            onChange={e => updateField('product_rate', e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Visibility</label>
          <select
            className="form-select"
            value={editProduct.is_visible ?? 'Yes'}
            onChange={e => updateField('is_visible', e.target.value)}
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>
        <div className="mb-2">
          <label className="form-label">Color</label>
          <input
            type="color"
            className="form-control form-control-color"
            value={editProduct.color ?? '#ffffff'}
            onChange={e => updateField('color', e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Order</label>
          <input
            type="number"
            className="form-control"
            value={editProduct.order ?? 0}
            onChange={e => updateField('order', Number(e.target.value))}
          />
        </div>
      </form>
    </CommonModal>
  )
}
