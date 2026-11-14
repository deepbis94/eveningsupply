type Props = {
  message?: string
}

export default function LoadingState({ message = 'Loading...' }: Props) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center my-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-2 mb-0 text-muted">{message}</p>
    </div>
  )
}
