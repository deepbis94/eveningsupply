'use client'

type Props = {
  currentPage: number
  lastPage: number
  disabled?: boolean
  onChangePage: (page: number) => void
}

export default function PaginationControls({
  currentPage,
  lastPage,
  disabled,
  onChangePage,
}: Props) {
  return (
    <div className="d-flex justify-content-center align-items-center gap-3 my-3">
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        disabled={disabled || currentPage <= 1}
        onClick={() => onChangePage(currentPage - 1)}
      >
        Prev
      </button>
      <span className="text-muted">
        Page {currentPage} of {Math.max(lastPage, 1)}
      </span>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        disabled={disabled || currentPage >= lastPage}
        onClick={() => onChangePage(currentPage + 1)}
      >
        Next
      </button>
    </div>
  )
}
