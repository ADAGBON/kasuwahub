import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="font-display text-7xl font-bold text-terracotta">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-indigo-ink">This stall is closed</h1>
      <p className="mt-2 text-muted">We couldn’t find the page you were looking for.</p>
      <Link to="/shop" className="btn btn-dark mt-8">Back to the market</Link>
    </div>
  )
}
