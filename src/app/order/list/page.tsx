'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import CustomerBillTable from '@/components/order/CustomerBillTable'
import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import PageHeader from '@/components/shared/PageHeader'
import {
  getCurrentDateBills,
  getCurrentGroupPrintPdf,
} from '@/lib/api/customerBills'
import { getVisibleProducts } from '@/lib/api/products'
import {
  collectBilledGroups,
  collectProductQuantityTotals,
  collectProductsForTable,
  getCustomerTotalBill,
  getPreviousDue,
} from '@/lib/utils/billTable'
import { getTodayLabel } from '@/lib/utils/dateLabels'
import { downloadBlob, getExportFileName } from '@/lib/utils/download'
import { formatAmount } from '@/lib/utils/roundAmount'
import { toast } from '@/lib/utils/toast'
import type { CustomerBillApiRecord } from '@/types/CustomerBill'
import type { Product } from '@/types/Product'

export default function CurrentOrdersPage() {
  const todayLabel = getTodayLabel()
  const [bills, setBills] = useState<CustomerBillApiRecord[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const billedCustomerGroups = useMemo(() => collectBilledGroups(bills), [bills])

  const productsForTable = useMemo(
    () => collectProductsForTable(bills, products),
    [bills, products]
  )

  const productQuantityTotals = useMemo(
    () => collectProductQuantityTotals(bills),
    [bills]
  )

  const loadCurrentBills = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const [currentBills, visibleProducts] = await Promise.all([
        getCurrentDateBills(),
        getVisibleProducts(),
      ])

      setBills(currentBills)
      setProducts(
        visibleProducts.map(product => ({
          ...product,
          color: product.color ?? '#ffffff',
        }))
      )

      const groups = collectBilledGroups(currentBills)

      setSelectedGroupId(prev => {
        const hasSelected = groups.some(
          group => group.customer_group_id === Number(prev)
        )
        return hasSelected ? prev : (groups[0]?.customer_group_id ?? '')
      })
    } catch (err) {
      console.error(err)
      setErrorMessage('Failed to load current date bills.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCurrentBills()
  }, [loadCurrentBills])

  async function printCurrentGroup() {
    if (!selectedGroupId) return

    setPrinting(true)

    try {
      const res = await getCurrentGroupPrintPdf(Number(selectedGroupId))
      const groupName =
        billedCustomerGroups.find(
          group => group.customer_group_id === Number(selectedGroupId)
        )?.group_name ?? 'customer-group'
      const fallback = `${groupName.replace(/\s+/g, '-').toLowerCase()}-current-bills.pdf`

      downloadBlob(
        res.data,
        getExportFileName(res.headers['content-disposition'], fallback),
        'application/pdf'
      )
      toast.success('Group bills printed successfully.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to print selected group bills.')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="container-fluid" style={{ padding: 10 }}>
      <PageHeader
        title="Current Date Bills"
        subtitle={`Showing today's customer bills and products for ${todayLabel}.`}
      >
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <select
            className="form-select"
            style={{ minWidth: 220 }}
            value={selectedGroupId}
            disabled={loading || printing}
            onChange={e =>
              setSelectedGroupId(e.target.value ? Number(e.target.value) : '')
            }
          >
            <option value="">Select Group</option>
            {billedCustomerGroups.map(group => (
              <option key={group.customer_group_id} value={group.customer_group_id}>
                {group.group_name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={loading || printing}
            onClick={() => void loadCurrentBills()}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : null}
            Refresh
          </button>

          <button
            type="button"
            className="btn btn-primary"
            disabled={!selectedGroupId || loading || printing}
            onClick={() => void printCurrentGroup()}
          >
            {printing ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : null}
            Print
          </button>
        </div>
      </PageHeader>

      {loading ? (
        <LoadingState message="Loading current date bills..." />
      ) : errorMessage ? (
        <div className="alert alert-danger">{errorMessage}</div>
      ) : bills.length === 0 ? (
        <EmptyState title="No bills found for the current date." />
      ) : (
        <CustomerBillTable
          bills={bills}
          products={productsForTable}
          productQuantityTotals={productQuantityTotals}
          productColumnsPosition="before-summary"
          grandTotalLabelColSpan={4}
          emptySummaryFooterCount={3}
          summaryHeaders={
            <>
              <th
                className="summary-header"
                style={{ minWidth: 110, background: '#f1f1f1' }}
              >
                Bill Amount
              </th>
              <th
                className="summary-header"
                style={{ minWidth: 110, background: '#f1f1f1' }}
              >
                Previous Due
              </th>
              <th
                className="summary-header"
                style={{ minWidth: 110, background: '#f1f1f1' }}
              >
                Total Bill
              </th>
            </>
          }
          renderSummaryCells={bill => (
            <>
              <td className="text-end fw-bold">{formatAmount(bill.total_bill)}</td>
              <td className="text-end">{formatAmount(getPreviousDue(bill))}</td>
              <td className="text-end fw-bold">
                {formatAmount(getCustomerTotalBill(bill))}
              </td>
            </>
          )}
        />
      )}
    </div>
  )
}
