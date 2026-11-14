import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  children?: ReactNode
}

export default function PageHeader({ title, subtitle, children }: Props) {
  return (
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 my-3">
      <div>
        <h3 className="mb-0">{title}</h3>
        {subtitle ? <p className="text-muted mb-0">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  )
}
