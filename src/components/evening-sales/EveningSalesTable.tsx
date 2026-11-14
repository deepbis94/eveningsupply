'use client'

import EveningSalesCustomerRow from '@/components/evening-sales/EveningSalesCustomerRow'
import GroupTotalRow from '@/components/evening-sales/GroupTotalRow'
import { useEveningSalesStore } from '@/stores/eveningSalesStore'

export default function EveningSalesTable() {
  const loading = useEveningSalesStore(s => s.loading)
  const loaded = useEveningSalesStore(s => s.loaded)
  const stepLoading = useEveningSalesStore(s => s.stepLoading)
  const products = useEveningSalesStore(s => s.products)
  const groups = useEveningSalesStore(s => s.groups)
  const currentStepIndex = useEveningSalesStore(s => s.currentStepIndex)
  const skippedSteps = useEveningSalesStore(s => s.skippedSteps)
  const getStepCustomerRows = useEveningSalesStore(s => s.getStepCustomerRows)
  const getStepLabel = useEveningSalesStore(s => s.getStepLabel)

  const currentGroup = groups[currentStepIndex] ?? null
  const stepCustomerRows = getStepCustomerRows()
  const stepLabel = getStepLabel()
  const isCurrentStepSkipped = skippedSteps.includes(currentStepIndex)

  if (loading) {
    return (
      <div className="evening-sales-table">
        <div className="evening-sales-table-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 mb-0 text-muted">Loading evening sales...</p>
        </div>
      </div>
    )
  }

  if (!currentGroup) {
    if (loaded) {
      return (
        <div className="evening-sales-table">
          <div className="evening-sales-table-loading">
            <p className="mb-0 text-muted">No customer groups found.</p>
          </div>
        </div>
      )
    }
    return <div className="evening-sales-table" />
  }

  return (
    <div className="evening-sales-table">
      <div className="evening-sales-step-header">
        <h4 className="mb-1">{currentGroup.group_name}</h4>
        <p className="text-muted mb-0">{stepLabel}</p>
        {isCurrentStepSkipped ? (
          <span className="badge bg-warning text-dark mt-2">Skipped</span>
        ) : null}
      </div>

      <div className="evening-sales-table-wrapper">
        {stepLoading ? (
          <div className="evening-sales-step-loading-overlay">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading group...</span>
            </div>
          </div>
        ) : null}

        <table className="table table-bordered table-sm">
          <thead>
            <tr>
              <th style={{ width: 60, background: '#e6f2ff' }}>Sl.</th>
              <th style={{ minWidth: 250, background: '#ffe6ff' }}>Customer Name</th>
              {products.map(product => (
                <th
                  key={product.product_id}
                  className="evening-sales-product-header"
                  style={{ backgroundColor: product.color }}
                >
                  {product.product_name}
                  <br />
                  ({product.product_quantity})
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {stepCustomerRows.map(item => (
              <EveningSalesCustomerRow
                key={item.customer.customer_id}
                serial={item.serial}
                row={item.row}
                groupId={item.groupId}
                customer={item.customer}
              />
            ))}
            <GroupTotalRow group={currentGroup} />
          </tbody>
        </table>
      </div>
    </div>
  )
}
