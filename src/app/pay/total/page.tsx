'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import PageHeader from '@/components/shared/PageHeader'
import { getYesterdayGroupedByCustomerGroup } from '@/lib/api/customerBills'
import {
  formatDateInputLabel,
  getTodayDateInputValue,
} from '@/lib/utils/dateLabels'
import { downloadCsv } from '@/lib/utils/download'
import { formatAmount, toMoneyAmount } from '@/lib/utils/roundAmount'
import { toast } from '@/lib/utils/toast'
import type { GroupedPaymentTotal } from '@/types/PaymentTotal'

export default function PaymentTotalPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateInputValue())
  const [groupTotals, setGroupTotals] = useState<GroupedPaymentTotal[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const selectedDateLabel = useMemo(
    () => formatDateInputLabel(selectedDate),
    [selectedDate]
  )

  const grandTotalBill = useMemo(
    () =>
      groupTotals.reduce(
        (sum, item) => sum + toMoneyAmount(item.total_bill ?? 0),
        0
      ),
    [groupTotals]
  )

  const grandTotalPayment = useMemo(
    () =>
      groupTotals.reduce(
        (sum, item) => sum + toMoneyAmount(item.total_payment ?? 0),
        0
      ),
    [groupTotals]
  )

  const loadPaymentTotals = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      setGroupTotals(await getYesterdayGroupedByCustomerGroup(selectedDate))
    } catch (err) {
      console.error(err)
      setErrorMessage('Failed to load payment totals.')
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    void loadPaymentTotals()
  }, [])

  function exportPaymentTotalsCsv() {
    const rows: Array<Array<string | number>> = [['Group', 'Total Bill', 'Payment']]

    for (const item of groupTotals) {
      rows.push([
        item.customer_group?.group_name ?? `Group ${item.customer_group_id}`,
        formatAmount(item.total_bill),
        formatAmount(item.total_payment),
      ])
    }

    rows.push([
      'Grand Total',
      formatAmount(grandTotalBill),
      formatAmount(grandTotalPayment),
    ])

    downloadCsv(`payment-total-${selectedDate}.csv`, rows)
    toast.success('Payment totals CSV exported successfully.')
  }

  return (
    <div className="container-fluid" style={{ padding: 10 }}>
      <PageHeader
        title="Payment Total"
        subtitle={`Bills grouped by customer group for ${selectedDateLabel}.`}
      >
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <input
            type="date"
            className="form-control"
            style={{ maxWidth: 180 }}
            value={selectedDate}
            disabled={loading}
            onChange={e => setSelectedDate(e.target.value)}
          />

          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={loading || !selectedDate}
            onClick={() => void loadPaymentTotals()}
          >
            {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            Show
          </button>

          <button
            type="button"
            className="btn btn-outline-success"
            disabled={loading || groupTotals.length === 0}
            onClick={exportPaymentTotalsCsv}
          >
            Export CSV
          </button>
        </div>
      </PageHeader>

      {loading ? (
        <LoadingState message="Loading payment totals..." />
      ) : errorMessage ? (
        <div className="alert alert-danger">{errorMessage}</div>
      ) : groupTotals.length === 0 ? (
        <EmptyState
          title={`No payment totals found for ${selectedDateLabel}.`}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {groupTotals.map(item => (
            <article
              key={item.customer_group_id}
              className="border bg-white overflow-hidden"
              style={{
                borderRadius: '0.75rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                className="p-3"
                style={{ background: '#ffe6ff', borderBottom: '1px solid #dee2e6' }}
              >
                <h5 className="mb-0">
                  {item.customer_group?.group_name ?? `Group ${item.customer_group_id}`}
                </h5>
              </div>

              <div className="row g-0">
                <div className="col-6 p-3" style={{ background: '#f8fbff' }}>
                  <span className="d-block text-muted small mb-1">Total Bill</span>
                  <strong style={{ fontSize: '1.25rem' }}>
                    {formatAmount(item.total_bill)}
                  </strong>
                </div>
                <div
                  className="col-6 p-3"
                  style={{ background: '#f7fff8', borderLeft: '1px solid #dee2e6' }}
                >
                  <span className="d-block text-muted small mb-1">Payment</span>
                  <strong style={{ fontSize: '1.25rem' }}>
                    {formatAmount(item.total_payment)}
                  </strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
