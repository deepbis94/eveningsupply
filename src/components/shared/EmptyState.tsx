type Props = {
  title: string
  message?: string
}

export default function EmptyState({ title, message }: Props) {
  return (
    <div className="text-center my-5">
      <h5>{title}</h5>
      {message ? <p className="text-muted">{message}</p> : null}
    </div>
  )
}
