'use client'

import { useState } from 'react'

import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import PageHeader from '@/components/shared/PageHeader'
import {
  deleteCustomerBill,
  searchCurrentDateBills,
} from '@/lib/api/customerBills'
import { formatAmount } from '@/lib/utils/roundAmount'
import { toast } from '@/lib/utils/toast'
import type { CustomerBillApiRecord } from '@/types/CustomerBill'

export default function DeleteOrderPage() {
  const [customerName, setCustomerName] = useState('')
  const [bills, setBills] = useState<CustomerBillApiRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  async function searchBills() {
    if (!customerName.trim()) return

    setLoading(true)
    setHasSearched(true)
    setErrorMessage('')

    try {
      setBills(await searchCurrentDateBills(customerName.trim()))
    } catch (err) {
      console.error(err)
      setErrorMessage('Failed to search customer bills.')
    } finally {
      setLoading(false)
    }
  }

  async function deleteBill(customerBillId: number) {
    if (!window.confirm('Delete this order?')) return

    setDeletingId(customerBillId)

    try {
      await deleteCustomerBill(customerBillId)
      setBills(prev => prev.filter(bill => bill.customer_bill_id !== customerBillId))
      toast.success('Order deleted successfully.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete order.')
    } finally {
      setDeletingId(null)
    }
  }

  function formatDate(value: string) {
    if (!value) return ''
    return new Date(value).toLocaleDateString()
  }

  return (
    <div className="container-fluid" style={{ padding: 10 }}>
      <PageHeader
        title="Delete Current Date Order"
        subtitle="Search current date bills by customer name."
      />

      <form
        className="d-flex gap-2 mb-3"
        style={{ maxWidth: 720 }}
        onSubmit={e => {
          e.preventDefault()
          void searchBills()
        }}
      >
        <input
          type="text"
          className="form-control"
          placeholder="Enter customer name"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ minWidth: 110 }}
          disabled={loading || !customerName.trim()}
        >
          {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
          Search
        </button>
      </form>

      {errorMessage ? <div className="alert alert-danger">{errorMessage}</div> : null}

      {loading ? (
        <LoadingState message="Searching bills..." />
      ) : hasSearched && bills.length === 0 ? (
        <EmptyState title="No current date bills found for this customer." />
      ) : (
        <div className="d-grid gap-3">
          {bills.map(bill => (
            <article
              key={bill.customer_bill_id}
              className="border rounded overflow-hidden bg-white"
            >
              <div
                className="d-flex justify-content-between align-items-start gap-3 p-3"
                style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}
              >
                <div>
                  <h5 className="mb-1">
                    {bill.customer?.customer_name ?? `Customer #${bill.customer_id}`}
                  </h5>
                  <div className="text-muted small">
                    Bill #{bill.customer_bill_id}
                    <span className="mx-1">|</span>
                    {formatDate(bill.created_date_at)}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  disabled={deletingId === bill.customer_bill_id}
                  onClick={() => void deleteBill(bill.customer_bill_id)}
                >
                  {deletingId === bill.customer_bill_id ? (
                    <span className="spinner-border spinner-border-sm me-2" />
                  ) : null}
                  Delete Order
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th style={{ width: 120 }}>Pack</th>
                      <th className="text-end" style={{ width: 100 }}>
                        Quantity
                      </th>
                      <th className="text-end" style={{ width: 140 }}>
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.products.map(product => (
                      <tr key={`${bill.customer_bill_id}-${product.product_id}`}>
                        <td className="fw-semibold">{product.product_name}</td>
                        <td>{product.product_quantity}</td>
                        <td className="text-end">{product.quantity}</td>
                        <td className="text-end fw-bold">
                          {formatAmount(product.product_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f1f1f1' }}>
                      <td colSpan={3}>
                        <strong>Total Bill</strong>
                      </td>
                      <td className="text-end fw-bold">
                        {formatAmount(bill.total_bill)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
