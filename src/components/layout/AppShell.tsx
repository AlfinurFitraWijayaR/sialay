import React, { useState } from 'react'
import { Link, useLocation, useRouter } from '@tanstack/react-router'
import { logoutFn } from '../../server/auth/actions'
import type { AuthenticatedAdmin } from '../../server/auth/session'

interface AppShellProps {
  children: React.ReactNode
  admin?: AuthenticatedAdmin | null
}

export function AppShell({ children, admin }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const location = useLocation()
  const router = useRouter()

  // On login page, render clean standalone view without administrative navigation
  if (location.pathname === '/login') {
    return <div className="min-h-screen bg-[#f8fafc]">{children}</div>
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logoutFn()
      await router.invalidate()
      window.location.href = '/login'
    } catch {
      window.location.href = '/login'
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] text-[#0f172a]">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full bg-[#328a6f]"
            aria-hidden="true"
          />
          <span className="font-bold tracking-wider text-sm uppercase">
            SIALAY
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-gray-700 hover:text-white rounded border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#328a6f]"
          aria-label={sidebarOpen ? 'Tutup navigasi' : 'Buka navigasi'}
          aria-expanded={sidebarOpen}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {sidebarOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#f8fafc] flex flex-col justify-between border-r border-[#e2e8f0] transition-transform duration-150 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="px-6 py-5 text-center">
            <div className="flex flex-col items-center">
              <img
                className="w-14 h-14 mb-2 object-contain"
                src="/icon.webp"
                alt="Logo Mundinglaya"
              />
              <h1 className="text-sm font-semibold tracking-wider uppercase text-gray-600">
                SIALAY
              </h1>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Sistem Administrasi MundingLaya
              </p>
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="px-3 py-4 space-y-1" aria-label="Menu Utama">
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-gray-500">
              Menu Utama
            </div>

            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded text-xs transition ${
                location.pathname === '/'
                  ? 'bg-[#e8f5f1] text-[#1B7B43] font-semibold'
                  : 'text-gray-700 hover:bg-[#E6F4EA] border-transparent'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-[#266b56]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>

              <span>Dashboard</span>
            </Link>

            <Link
              to="/players"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded text-xs border transition ${
                location.pathname.startsWith('/players')
                  ? 'bg-[#e8f5f1] text-[#1B7B43] border-[#2e6e5a] font-semibold'
                  : 'text-gray-700 hover:bg-[#E6F4EA] border-transparent'
              }`}
            >
              <svg
                className="w-4 h-4 text-[#266b56]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>Daftar Siswa</span>
            </Link>
          </nav>
        </div>

        {/* User Account & Footer */}
        <div className="p-3">
          {/* Admin User Card */}
          <div className="flex items-center justify-between p-2.5 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#266b56] text-white text-[10px] font-bold flex items-center justify-center shrink-0 border border-[#3b8c73]">
                A
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">
                  {admin?.username || 'Administrator'}
                </p>
                <p className="text-[10px] text-gray-500">Sesi Aktif</p>
              </div>
            </div>
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="text-[11px] font-medium text-red-700 hover:text-red-800 px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition disabled:opacity-50"
            >
              {isLoggingOut ? '...' : 'Keluar'}
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-between h-14 px-8 bg-white border-b border-[#e2e8f0]">
          <div className="text-xs text-[#475569]">
            <span className="font-medium text-[#0f172a]">
              WELKAMBEK BOSS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-[#475569]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Masuk sebagai: <strong>{admin?.username || 'admin'}</strong>
              </span>
            </div>
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="text-xs font-medium text-red-700 hover:text-red-800 px-2.5 py-1 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition"
            >
              Keluar
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
