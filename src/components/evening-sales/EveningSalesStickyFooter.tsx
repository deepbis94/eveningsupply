'use client'

import { useEveningSalesStore } from '@/stores/eveningSalesStore'

type Props = {
  onPrevious: () => void
  onNext: () => void
  onSkip: () => void
  onSave: () => void
}

export default function EveningSalesStickyFooter({
  onPrevious,
  onNext,
  onSkip,
  onSave,
}: Props) {
  const products = useEveningSalesStore(s => s.products)
  const finalTotals = useEveningSalesStore(s => s.finalTotals)
  const loading = useEveningSalesStore(s => s.loading)
  const stepLoading = useEveningSalesStore(s => s.stepLoading)
  const saving = useEveningSalesStore(s => s.saving)
  const currentStepIndex = useEveningSalesStore(s => s.currentStepIndex)
  const groups = useEveningSalesStore(s => s.groups)
  const getStepLabel = useEveningSalesStore(s => s.getStepLabel)

  const totalSteps = groups.length
  const isFirstStep = currentStepIndex === 0
  const isLastStep = totalSteps === 0 || currentStepIndex >= totalSteps - 1
  const stepLabel = getStepLabel()
  const busy = loading || stepLoading || saving

  return (
    <div className="evening-sales-sticky-footer">
      <div className="evening-sales-grand-total-bar">
        <div className="evening-sales-grand-total-label">
          <strong>Grand Total</strong>
        </div>

        <div className="evening-sales-grand-total-values">
          {products.map(product => (
            <div key={product.product_id} className="evening-sales-grand-total-item">
              <span
                className="evening-sales-product-dot"
                style={{ backgroundColor: product.color ?? '#666' }}
              />
              <span className="evening-sales-product-name">{product.product_name}</span>
              <strong className="evening-sales-product-total">
                {finalTotals?.[product.product_id] ?? 0}
              </strong>
            </div>
          ))}
        </div>
      </div>

      <div className="evening-sales-step-actions">
        <div className="evening-sales-step-actions-left">
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={isFirstStep || busy}
            onClick={onPrevious}
          >
            Previous
          </button>
        </div>

        <div className="evening-sales-step-actions-center">
          <span className="evening-sales-step-indicator">{stepLabel}</span>
        </div>

        <div className="evening-sales-step-actions-right">
          <button
            type="button"
            className="btn btn-outline-warning"
            disabled={busy}
            onClick={onSkip}
          >
            Skip
          </button>

          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={onSave}
          >
            {saving ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : null}
            Save
          </button>

          <button
            type="button"
            className="btn btn-success"
            disabled={isLastStep || busy}
            onClick={onNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
