import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  const [waking, setWaking] = useState(false)
  useEffect(() => {
    const onSlow = (e) => setWaking(e.detail)
    window.addEventListener('kasuwahub:slow', onSlow)
    return () => window.removeEventListener('kasuwahub:slow', onSlow)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {waking && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-indigo-ink px-4 py-3 text-sm text-white shadow-2xl sm:inset-x-auto sm:right-6" role="status">
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Waking up the server — the first load can take up to a minute. Thanks for your patience!
        </div>
      )}
    </div>
  )
}
