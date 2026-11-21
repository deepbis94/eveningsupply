'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'

import CustomerBillTable from '@/components/order/CustomerBillTable'
import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import PageHeader from '@/components/shared/PageHeader'
import {
  getYesterdayDateBills,
  updateYesterdayPaymentStatuses,
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
import { formatAmount, toMoneyAmount } from '@/lib/utils/roundAmount'
import { toast } from '@/lib/utils/toast'
import type { CustomerBillApiRecord } from '@/types/CustomerBill'
import type { Product } from '@/types/Product'

export default function OrderPaymentPage() {
  const todayLabel = getTodayLabel()
  const [bills, setBills] = useState<CustomerBillApiRecord[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [paymentInputs, setPaymentInputs] = useState<Record<number, string>>({})
  const [balanceInputs, setBalanceInputs] = useState<Record<number, number>>({})
  const paymentInputRefs = useRef<Array<HTMLInputElement | null>>([])

  function paymentAmount(billId: number) {
    const raw = paymentInputs[billId]
    if (raw === undefined || raw === '' || raw === '.') return 0
    return Number(raw)
  }

  const billedCustomerGroups = useMemo(() => collectBilledGroups(bills), [bills])

  const productsForTable = useMemo(
    () => collectProductsForTable(bills, products),
    [bills, products]
  )

  const productQuantityTotals = useMemo(
    () => collectProductQuantityTotals(bills),
    [bills]
  )

  function calculateBillBalance(bill: CustomerBillApiRecord, payment: number) {
    return getCustomerTotalBill(bill) - toMoneyAmount(payment || 0)
  }

  function initializePaymentState(nextBills: CustomerBillApiRecord[]) {
    const balances: Record<number, number> = {}
    for (const bill of nextBills) {
      balances[bill.customer_bill_id] = getCustomerTotalBill(bill)
    }
    setPaymentInputs({})
    setBalanceInputs(balances)
  }

  const loadCurrentBills = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const [todayBills, visibleProducts] = await Promise.all([
        getYesterdayDateBills(),
        getVisibleProducts(),
      ])

      setBills(todayBills)
      setProducts(
        visibleProducts.map(product => ({
          ...product,
          color: product.color ?? '#ffffff',
        }))
      )
      paymentInputRefs.current = []
      initializePaymentState(todayBills)

      const groups = collectBilledGroups(todayBills)

      setSelectedGroupId(prev => {
        const hasSelected = groups.some(
          group => group.customer_group_id === Number(prev)
        )
        return hasSelected ? prev : (groups[0]?.customer_group_id ?? '')
      })
    } catch (err) {
      console.error(err)
      setErrorMessage("Failed to load today's bills.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCurrentBills()
  }, [loadCurrentBills])

  function displayPayment(billId: number) {
    return paymentInputs[billId] ?? ''
  }

  function setPaymentInput(
    bill: CustomerBillApiRecord,
    event: ChangeEvent<HTMLInputElement>
  ) {
    let raw = event.target.value.replace(/[^\d.]/g, '')
    const dotIndex = raw.indexOf('.')

    if (dotIndex !== -1) {
      const whole = raw.slice(0, dotIndex)
      const fraction = raw.slice(dotIndex + 1).replace(/\./g, '').slice(0, 2)
      raw = `${whole}.${fraction}`
    }

    const payment = raw === '' || raw === '.' ? 0 : Number(raw)

    setPaymentInputs(prev => ({
      ...prev,
      [bill.customer_bill_id]: raw,
    }))
    setBalanceInputs(prev => ({
      ...prev,
      [bill.customer_bill_id]: calculateBillBalance(bill, payment),
    }))
  }

  function calculateBalance(bill: CustomerBillApiRecord, paymentOverride?: number) {
    const payment =
      paymentOverride ?? paymentAmount(bill.customer_bill_id)
    setBalanceInputs(prev => ({
      ...prev,
      [bill.customer_bill_id]: calculateBillBalance(bill, payment),
    }))
  }

  function onPaymentKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    index: number,
    bill: CustomerBillApiRecord
  ) {
    if (event.key !== 'Enter') return

    event.preventDefault()
    const raw = event.currentTarget.value
    const payment = raw === '' || raw === '.' ? 0 : Number(raw)
    calculateBalance(bill, payment)

    const nextInput = paymentInputRefs.current[index + 1]
    if (nextInput) {
      nextInput.focus()
      nextInput.select()
    }
  }

  async function saveGroupOrder() {
    if (!selectedGroupId) return

    const groupBills = bills.filter(
      bill => bill.customer?.customer_group_id === Number(selectedGroupId)
    )

    setSaving(true)

    try {
      await updateYesterdayPaymentStatuses({
        bills: groupBills.map(bill => ({
          customer_bill_id: bill.customer_bill_id,
          payment: toMoneyAmount(paymentAmount(bill.customer_bill_id)),
          pay_status: true,
          balance: toMoneyAmount(balanceInputs[bill.customer_bill_id] ?? 0),
        })),
      })

      await loadCurrentBills()
      toast.success('Group order saved successfully.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save selected group order.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-fluid" style={{ padding: 10 }}>
      <PageHeader
        title="Order Payment"
        subtitle={`Payment for today's bills (${todayLabel}) and print action.`}
      >
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <select
            className="form-select"
            style={{ minWidth: 220 }}
            value={selectedGroupId}
            disabled={loading || saving}
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
            disabled={loading || saving}
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
            disabled={!selectedGroupId || loading || saving}
            onClick={() => void saveGroupOrder()}
          >
            {saving ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : null}
            Save Group Order
          </button>
        </div>
      </PageHeader>

      {loading ? (
        <LoadingState message="Loading today's bills..." />
      ) : errorMessage ? (
        <div className="alert alert-danger">{errorMessage}</div>
      ) : bills.length === 0 ? (
        <EmptyState title="No bills found for today." />
      ) : (
        <CustomerBillTable
          bills={bills}
          products={productsForTable}
          productQuantityTotals={productQuantityTotals}
          productColumnsPosition="after-summary"
          grandTotalLabelColSpan={4}
          emptySummaryFooterCount={4}
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
              <th
                className="summary-header"
                style={{ minWidth: 110, background: '#f1f1f1' }}
              >
                Payment
              </th>
              <th
                className="summary-header"
                style={{ minWidth: 110, background: '#f1f1f1' }}
              >
                Balance
              </th>
            </>
          }
          renderSummaryCells={(bill, index) => (
            <>
              <td className="text-end fw-bold">{formatAmount(bill.total_bill)}</td>
              <td className="text-end">{formatAmount(getPreviousDue(bill))}</td>
              <td className="text-end fw-bold">
                {formatAmount(getCustomerTotalBill(bill))}
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm text-center qty-input"
                  style={{ fontSize: 19, fontWeight: 500 }}
                  value={displayPayment(bill.customer_bill_id)}
                  ref={el => {
                    paymentInputRefs.current[index] = el
                  }}
                  onChange={e => setPaymentInput(bill, e)}
                  onKeyDown={e => onPaymentKeyDown(e, index, bill)}
                  onBlur={e => {
                    const raw = e.currentTarget.value
                    const payment =
                      raw === '' || raw === '.' ? 0 : Number(raw)
                    calculateBalance(bill, payment)
                  }}
                />
              </td>
              <td className="text-end fw-bold">
                {formatAmount(
                  balanceInputs[bill.customer_bill_id] ?? getCustomerTotalBill(bill)
                )}
              </td>
            </>
          )}
        />
      )}
    </div>
  )
}
