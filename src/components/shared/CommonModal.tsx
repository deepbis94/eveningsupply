'use client'

import type { ReactNode } from 'react'

type Props = {
  show: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'lg' | 'xl'
}

export default function CommonModal({ show, title, onClose, children, footer, size }: Props) {
  if (!show) return null

  const dialogClass = ['modal-dialog', size ? `modal-${size}` : ''].filter(Boolean).join(' ')

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog">
        <div className={dialogClass}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            {footer ? <div className="modal-footer">{footer}</div> : null}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  )
}
