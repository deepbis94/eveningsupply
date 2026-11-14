'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import PageHeader from '@/components/shared/PageHeader'
import PaginationControls from '@/components/shared/PaginationControls'
import {
  deleteCustomerBillsByDateRange,
  exportBillsByDateRangeCsv,
  exportBillsByDateRangePdf,
  getBillsByDateRange,
} from '@/lib/api/customerBills'
import { getDateInputValue } from '@/lib/utils/dateLabels'
import { downloadBlob, getExportFileName } from '@/lib/utils/download'
import { formatAmount } from '@/lib/utils/roundAmount'
import { toast } from '@/lib/utils/toast'
import type { CustomerBillApiRecord } from '@/types/CustomerBill'
import { emptyPagination, type Pagination } from '@/types/Pagination'

const PER_PAGE_OPTIONS = [10, 20, 30, 40, 50, 100]

function getOrderDateKey(value: string) {
  if (!value) return ''
  return value.slice(0, 10)
}

function formatDate(value: string) {
  if (!value) return ''

  const dateKey = getOrderDateKey(value)
  const [year, month, day] = dateKey.split('-').map(Number)

  if (!year || !month || !day) {
    return new Date(value).toLocaleDateString()
  }

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function OrderHistoryPage() {
  const today = getDateInputValue(new Date())
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [perPage, setPerPage] = useState(10)
  const [orders, setOrders] = useState<CustomerBillApiRecord[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [exportingCsv, setExportingCsv] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [pagination, setPagination] = useState<Pagination>({ ...emptyPagination })

  const filteredOrders = useMemo(() => {
    if (selectedCustomerId === null) return orders
    return orders.filter(order => order.customer_id === selectedCustomerId)
  }, [orders, selectedCustomerId])

  const ordersByDate = useMemo(() => {
    const groups: { date: string; orders: CustomerBillApiRecord[] }[] = []
    const groupMap = new Map<string, CustomerBillApiRecord[]>()

    for (const order of filteredOrders) {
      const dateKey = getOrderDateKey(order.created_date_at)

      if (!groupMap.has(dateKey)) {
        const groupOrders: CustomerBillApiRecord[] = []
        groupMap.set(dateKey, groupOrders)
        groups.push({ date: dateKey, orders: groupOrders })
      }

      groupMap.get(dateKey)!.push(order)
    }

    return groups
  }, [filteredOrders])

  const hasMultipleDates = ordersByDate.length > 1

  const dateRangeLabel = useMemo(() => {
    if (startDate === endDate) return formatDate(startDate)
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  }, [startDate, endDate])

  const loadHistory = useCallback(
    async (page: number, options?: { startDate: string; endDate: string; perPage: number }) => {
      const rangeStart = options?.startDate ?? startDate
      const rangeEnd = options?.endDate ?? endDate
      const pageSize = options?.perPage ?? perPage

      setLoading(true)
      setErrorMessage('')

      try {
        const res = await getBillsByDateRange({
          startDate: rangeStart,
          endDate: rangeEnd,
          perPage: pageSize,
          page,
        })

        setOrders(res.data ?? [])
        setPagination(
          res.pagination ?? {
            ...emptyPagination,
            per_page: pageSize,
          }
        )
        setSelectedCustomerId(null)
      } catch (err) {
        console.error(err)
        setErrorMessage('Failed to load order history.')
      } finally {
        setLoading(false)
      }
    },
    [startDate, endDate, perPage]
  )

  useEffect(() => {
    void loadHistory(1)
  }, [])

  function resetFilters() {
    setStartDate(today)
    setEndDate(today)
    setPerPage(10)
    setSelectedCustomerId(null)
    void loadHistory(1, { startDate: today, endDate: today, perPage: 10 })
  }

  async function deleteHistoryByDateRange() {
    if (!startDate || !endDate) return

    const confirmed = window.confirm(
      `Delete all customer bills from ${startDate} to ${endDate}? This action cannot be undone.`
    )
    if (!confirmed) return

    setBulkDeleting(true)

    try {
      const res = await deleteCustomerBillsByDateRange({
        start_date: startDate,
        end_date: endDate,
      })

      const deletedCount = res.data?.deleted ?? 0
      const deletedStartDate = res.data?.start_date ?? startDate
      const deletedEndDate = res.data?.end_date ?? endDate
      const deletedSummary = `Deleted ${deletedCount} bills from ${deletedStartDate} to ${deletedEndDate}.`

      setSelectedCustomerId(null)
      await loadHistory(1)
      toast.success(
        res.message ? `${res.message}. ${deletedSummary}` : deletedSummary
      )
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete bills for the selected date range.')
    } finally {
      setBulkDeleting(false)
    }
  }

  async function exportHistoryCsv() {
    if (!startDate || !endDate) return

    setExportingCsv(true)

    try {
      const res = await exportBillsByDateRangeCsv({ startDate, endDate })
      downloadBlob(
        res.data,
        getExportFileName(
          res.headers['content-disposition'],
          `order-history-${startDate}-to-${endDate}.csv`
        ),
        'text/csv'
      )
      toast.success('Order history CSV exported successfully.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to export order history CSV.')
    } finally {
      setExportingCsv(false)
    }
  }

  async function exportHistoryPdf() {
    if (!startDate || !endDate) return

    setExportingPdf(true)

    try {
      const res = await exportBillsByDateRangePdf({ startDate, endDate })
      downloadBlob(
        res.data,
        getExportFileName(
          res.headers['content-disposition'],
          `order-history-${startDate}-to-${endDate}.pdf`
        ),
        'application/pdf'
      )
      toast.success('Order history PDF exported successfully.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to export order history PDF.')
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="container-fluid" style={{ padding: 10 }}>
      <PageHeader title="Order History" subtitle="Search customer bills by date range.">
        <h4 className="mb-0">{dateRangeLabel}</h4>
      </PageHeader>

      <form
        className="d-flex gap-2 align-items-center flex-wrap"
        onSubmit={e => {
          e.preventDefault()
          void loadHistory(1)
        }}
      >
        <input
          type="date"
          className="form-control"
          style={{ maxWidth: 180 }}
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="form-control"
          style={{ maxWidth: 180 }}
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
        <select
          className="form-select"
          style={{ maxWidth: 150 }}
          value={perPage}
          disabled={loading || bulkDeleting}
          onChange={e => {
            const next = Number(e.target.value)
            setPerPage(next)
            void loadHistory(1, { startDate, endDate, perPage: next })
          }}
        >
          {PER_PAGE_OPTIONS.map(count => (
            <option key={count} value={count}>
              {count} per page
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || bulkDeleting || !startDate || !endDate}
        >
          {loading && !bulkDeleting ? (
            <span className="spinner-border spinner-border-sm me-2" />
          ) : null}
          Show
        </button>

        <button
          type="button"
          className="btn btn-success"
          disabled={loading || bulkDeleting}
          onClick={resetFilters}
        >
          Reset
        </button>

        <button
          type="button"
          className="btn btn-outline-success"
          disabled={
            loading ||
            bulkDeleting ||
            exportingCsv ||
            exportingPdf ||
            !startDate ||
            !endDate
          }
          onClick={() => void exportHistoryCsv()}
        >
          {exportingCsv ? (
            <span className="spinner-border spinner-border-sm me-2" />
          ) : null}
          Export CSV
        </button>

        <button
          type="button"
          className="btn btn-outline-primary"
          disabled={
            loading ||
            bulkDeleting ||
            exportingCsv ||
            exportingPdf ||
            !startDate ||
            !endDate
          }
          onClick={() => void exportHistoryPdf()}
        >
          {exportingPdf ? (
            <span className="spinner-border spinner-border-sm me-2" />
          ) : null}
          Export PDF
        </button>

        <button
          type="button"
          className="btn btn-outline-danger"
          disabled={loading || bulkDeleting || !startDate || !endDate}
          onClick={() => void deleteHistoryByDateRange()}
        >
          {bulkDeleting ? (
            <span className="spinner-border spinner-border-sm me-2" />
          ) : null}
          Delete Date Range
        </button>
      </form>

      <hr />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Customer Order</h4>
        {pagination.total > 0 ? (
          <span className="text-muted">
            Showing {pagination.from}-{pagination.to} of {pagination.total}
          </span>
        ) : null}
      </div>

      {loading ? <LoadingState message="Loading order history..." /> : null}

      {!loading && errorMessage ? (
        <div className="alert alert-danger">{errorMessage}</div>
      ) : null}

      {!loading && !errorMessage && orders.length === 0 ? (
        <EmptyState title="No orders for this day" />
      ) : null}

      {!loading && !errorMessage && orders.length > 0 ? (
        <div className="row g-3">
          <div className="col-lg-3">
            <ul className="list-group" style={{ position: 'sticky', top: '1rem', cursor: 'pointer' }}>
              <li
                className={`list-group-item${selectedCustomerId === null ? ' active' : ''}`}
                onClick={() => setSelectedCustomerId(null)}
              >
                All
              </li>
              {orders.map(order => (
                <li
                  key={`customer-${order.customer_bill_id}`}
                  className={`list-group-item${
                    selectedCustomerId === order.customer_id ? ' active' : ''
                  }`}
                  onClick={() => setSelectedCustomerId(order.customer_id)}
                >
                  {order.customer?.customer_name ?? `Customer #${order.customer_id}`}
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-9">
            {ordersByDate.map(group => (
              <div key={group.date}>
                {hasMultipleDates ? (
                  <h5 className="date-headline">{formatDate(group.date)}</h5>
                ) : null}

                {group.orders.map(order => (
                  <div key={order.customer_bill_id} className="card mb-3">
                    <h4 className="card-header">
                      {order.customer?.customer_name ?? `Customer #${order.customer_id}`}
                      <span className="text-muted small ms-2">
                        Bill #{order.customer_bill_id}
                        {!hasMultipleDates ? ` | ${formatDate(order.created_date_at)}` : null}
                      </span>
                    </h4>

                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-bordered table-sm mb-0">
                          <thead>
                            <tr>
                              <th>Product Name</th>
                              <th>Product Quantity</th>
                              <th className="text-end">Order Quantity</th>
                              <th className="text-end">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.products.map(product => (
                              <tr
                                key={`${order.customer_bill_id}-${product.product_id}`}
                              >
                                <td>{product.product_name}</td>
                                <td>{product.product_quantity}</td>
                                <td className="text-end">{product.quantity}</td>
                                <td className="text-end">
                                  {formatAmount(product.product_total)}
                                </td>
                              </tr>
                            ))}
                            <tr>
                              <td colSpan={3}>
                                <b>Total Bill</b>
                              </td>
                              <td className="text-end fw-bold">
                                {formatAmount(order.total_bill)}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={3}>
                                <b>Payment</b>
                              </td>
                              <td className="text-end fw-bold">
                                {formatAmount(order.payment)}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={3}>
                                <b>Balance</b>
                              </td>
                              <td className="text-end fw-bold">
                                {formatAmount(order.balance)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <PaginationControls
              currentPage={pagination.current_page}
              lastPage={pagination.last_page}
              disabled={loading}
              onChangePage={page => void loadHistory(page)}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
