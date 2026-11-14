'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import EmptyState from '@/components/shared/EmptyState'
import LoadingState from '@/components/shared/LoadingState'
import PageHeader from '@/components/shared/PageHeader'
import {
  getCurrentProductSummaryByGroup,
  getEveningTotalPrintPdf,
} from '@/lib/api/customerBills'
import { getVisibleProducts } from '@/lib/api/products'
import { getTodayLabel } from '@/lib/utils/dateLabels'
import { downloadBlob, downloadCsv, getExportFileName } from '@/lib/utils/download'
import { toast } from '@/lib/utils/toast'
import type {
  EveningTotalGroupSummary,
  EveningTotalProductSummary,
} from '@/types/EveningTotal'
import type { Product } from '@/types/Product'

export default function EveningTotalPage() {
  const todayLabel = getTodayLabel()
  const [groups, setGroups] = useState<EveningTotalGroupSummary[]>([])
  const [grandTotals, setGrandTotals] = useState<EveningTotalProductSummary[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const productsForTable = useMemo(
    () => [...products].sort((a, b) => a.order - b.order),
    [products]
  )

  const loadEveningTotals = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const [summary, visibleProducts] = await Promise.all([
        getCurrentProductSummaryByGroup(),
        getVisibleProducts(),
      ])

      setGroups(summary?.groups ?? [])
      setGrandTotals(summary?.grand_totals ?? [])
      setProducts(visibleProducts)
    } catch (err) {
      console.error(err)
      setErrorMessage('Failed to load evening totals.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEveningTotals()
  }, [loadEveningTotals])

  function getGroupProductQuantity(group: EveningTotalGroupSummary, productId: number) {
    return (
      group.products.find(product => Number(product.product_id) === productId)
        ?.total_quantity ?? 0
    )
  }

  function getGrandProductQuantity(productId: number) {
    return (
      grandTotals.find(product => Number(product.product_id) === productId)
        ?.total_quantity ?? 0
    )
  }

  function exportEveningTotalsCsv() {
    const rows: Array<Array<string | number>> = [
      [
        'Group',
        ...productsForTable.map(
          product => `${product.product_name} (${product.product_quantity})`
        ),
      ],
    ]

    for (const group of groups) {
      rows.push([
        group.customer_group?.group_name ?? `Group ${group.customer_group_id}`,
        ...productsForTable.map(product =>
          getGroupProductQuantity(group, product.product_id)
        ),
      ])
    }

    rows.push([
      'Total',
      ...productsForTable.map(product => getGrandProductQuantity(product.product_id)),
    ])

    downloadCsv(`evening-total-${todayLabel}.csv`, rows)
    toast.success('Evening totals CSV exported successfully.')
  }

  async function downloadEveningTotalPdf() {
    setPrinting(true)

    try {
      const res = await getEveningTotalPrintPdf()
      downloadBlob(
        res.data,
        getExportFileName(
          res.headers['content-disposition'],
          `evening-total-${todayLabel}.pdf`
        ),
        'application/pdf'
      )
      toast.success('Evening total PDF downloaded successfully.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to download evening total PDF.')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="container-fluid" style={{ padding: 10 }}>
      <PageHeader
        title={`Total Table : ${todayLabel}`}
        subtitle="Current date product summary by customer group."
      >
        <div className="d-flex gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={loading || printing || groups.length === 0}
            onClick={() => void downloadEveningTotalPdf()}
          >
            {printing ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : null}
            Print PDF
          </button>

          <button
            type="button"
            className="btn btn-outline-success"
            disabled={loading || groups.length === 0}
            onClick={exportEveningTotalsCsv}
          >
            Export CSV
          </button>

          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={() => void loadEveningTotals()}
          >
            {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            Refresh
          </button>
        </div>
      </PageHeader>

      {loading ? (
        <LoadingState message="Loading evening totals..." />
      ) : errorMessage ? (
        <div className="alert alert-danger">{errorMessage}</div>
      ) : groups.length === 0 ? (
        <EmptyState title="No evening totals found for current date." />
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                <th style={{ minWidth: 180, background: '#e6f2ff' }}>Product</th>
                {productsForTable.map(product => (
                  <th
                    key={product.product_id}
                    className="product-header"
                    style={{ minWidth: 110, background: '#ffe6ff' }}
                  >
                    {product.product_name}
                    <br />({product.product_quantity})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(group => (
                <tr key={group.customer_group_id}>
                  <td className="fw-semibold" style={{ background: '#f8fbff' }}>
                    {group.customer_group?.group_name ??
                      `Group ${group.customer_group_id}`}
                  </td>
                  {productsForTable.map(product => (
                    <td
                      key={`${group.customer_group_id}-${product.product_id}`}
                      className="text-center"
                    >
                      {getGroupProductQuantity(group, product.product_id)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr style={{ background: '#222', color: '#fff', fontWeight: 'bold' }}>
                <td>
                  <b>Total</b>
                </td>
                {productsForTable.map(product => (
                  <td key={`total-${product.product_id}`} className="text-center">
                    <b>{getGrandProductQuantity(product.product_id)}</b>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
