'use client'

import { useEffect, useState } from 'react'

import EveningSalesStickyFooter from '@/components/evening-sales/EveningSalesStickyFooter'
import EveningSalesTable from '@/components/evening-sales/EveningSalesTable'
import PageHeader from '@/components/shared/PageHeader'
import { getTodayLabel } from '@/lib/utils/dateLabels'
import { toast } from '@/lib/utils/toast'
import { useEveningSalesStore } from '@/stores/eveningSalesStore'


export default function EveningSalesPage() {
  const load = useEveningSalesStore(s => s.load)
  const goToStep = useEveningSalesStore(s => s.goToStep)
  const prevStep = useEveningSalesStore(s => s.prevStep)
  const nextStep = useEveningSalesStore(s => s.nextStep)
  const skipStep = useEveningSalesStore(s => s.skipStep)
  const save = useEveningSalesStore(s => s.save)
  const loaded = useEveningSalesStore(s => s.loaded)
  const groups = useEveningSalesStore(s => s.groups)
  const currentStepIndex = useEveningSalesStore(s => s.currentStepIndex)
  const skippedSteps = useEveningSalesStore(s => s.skippedSteps)

  const [todayLabel] = useState(() => getTodayLabel())

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        await load()
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          toast.error('Failed to load evening sales.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [load])

  async function handleGoToStep(index: number) {
    try {
      await goToStep(index)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load group bills.')
    }
  }

  async function handlePrevious() {
    try {
      await prevStep()
    } catch (err) {
      console.error(err)
      toast.error('Failed to load group bills.')
    }
  }

  async function handleNext() {
    try {
      await nextStep()
    } catch (err) {
      console.error(err)
      toast.error('Failed to load group bills.')
    }
  }

  async function handleSkip() {
    try {
      await skipStep()
    } catch (err) {
      console.error(err)
      toast.error('Failed to load group bills.')
    }
  }

  async function handleSave() {
    try {
      await save()
      toast.success('Orders saved successfully.')
    } catch (err) {
      console.error(err)
      const apiMessage =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message
      const text =
        typeof apiMessage === 'string'
          ? apiMessage
          : err instanceof Error
            ? err.message
            : 'Failed to save orders.'
      toast.error(text)
    }
  }

  return (
    <div className="evening-sales-view">
      <PageHeader title="Evening Sales" subtitle={`Date: ${todayLabel}`}>
        {loaded && groups.length > 0 ? (
          <div className="evening-sales-step-dots">
            {groups.map((group, index) => (
              <button
                key={group.customer_group_id}
                type="button"
                className={[
                  'evening-sales-step-dot',
                  index === currentStepIndex ? 'active' : '',
                  skippedSteps.includes(index) ? 'skipped' : '',
                  index < currentStepIndex ? 'completed' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title={group.group_name}
                onClick={() => void handleGoToStep(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        ) : null}
      </PageHeader>

      <EveningSalesTable />

      <EveningSalesStickyFooter
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSkip={handleSkip}
        onSave={handleSave}
      />
    </div>
  )
}
