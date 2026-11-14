import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="text-center my-5 py-5">
      <h1 className="display-6 fw-bold mb-2">404 - Page Not Found</h1>
      <p className="text-muted mb-4">The requested page could not be found.</p>
      <Link href="/" className="btn btn-primary">
        Back to Dashboard
      </Link>
    </div>
  )
}
