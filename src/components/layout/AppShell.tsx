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
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full bg-[#FBC02D]"
            aria-hidden="true"
          />
          <span className="font-bold tracking-wider text-sm uppercase text-[#0f172a]">
            SIALAY
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-gray-700 hover:text-black rounded border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#FBC02D]"
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
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white flex flex-col justify-between border-r border-[#e2e8f0] transition-transform duration-150 ease-in-out overflow-y-auto md:translate-x-0 ${
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
              <h1 className="text-sm font-semibold tracking-wider uppercase text-[#0f172a]">
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition ${
                location.pathname === '/'
                  ? 'bg-[#FEF9C3] text-[#78350F] font-semibold border-l-4 border-[#FBC02D]'
                  : 'text-gray-700 hover:bg-[#FEF9C3]/50 hover:text-[#0f172a] border-l-4 border-transparent'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 ${
                  location.pathname === '/' ? 'text-[#C62828]' : 'text-gray-500'
                }`}
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition ${
                location.pathname.startsWith('/players')
                  ? 'bg-[#FEF9C3] text-[#78350F] font-semibold border-l-4 border-[#FBC02D]'
                  : 'text-gray-700 hover:bg-[#FEF9C3]/50 hover:text-[#0f172a] border-l-4 border-transparent'
              }`}
            >
              <svg
                className={`w-4 h-4 ${
                  location.pathname.startsWith('/players')
                    ? 'text-[#C62828]'
                    : 'text-gray-500'
                }`}
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

            <Link
              to="/coaches"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition ${
                location.pathname.startsWith('/coaches')
                  ? 'bg-[#FEF9C3] text-[#78350F] font-semibold border-l-4 border-[#FBC02D]'
                  : 'text-gray-700 hover:bg-[#FEF9C3]/50 hover:text-[#0f172a] border-l-4 border-transparent'
              }`}
            >
              <svg
                className={`w-4 h-4 ${
                  location.pathname.startsWith('/coaches')
                    ? 'text-[#C62828]'
                    : 'text-gray-500'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Daftar Pelatih</span>
            </Link>
          </nav>
        </div>

        {/* User Account & Footer */}
        <div className="p-3">
          {/* Admin User Card */}
          <div className="flex items-center justify-between p-2.5 mb-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#C62828] text-white text-[10px] font-bold flex items-center justify-center shrink-0 border border-[#B71C1C]">
                A
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate text-[#0f172a]">
                  {admin?.username || 'Administrator'}
                </p>
                <p className="text-[10px] text-gray-500">Sesi Aktif</p>
              </div>
            </div>
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="text-[11px] font-medium text-[#C62828] hover:text-[#B71C1C] px-2 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] rounded border border-[#FECACA] transition disabled:opacity-50 cursor-pointer"
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
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        <header className="hidden md:flex items-center justify-between h-14 px-8 bg-white border-b border-[#e2e8f0]">
          <div className="text-xs text-[#475569]">
            <span className="font-semibold text-[#0f172a]">
              SSB MUNDINGLAYA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-[#475569]">
              <span className="w-2 h-2 rounded-full bg-[#FBC02D]" />
              <span>
                Masuk sebagai: <strong>{admin?.username || 'admin'}</strong>
              </span>
            </div>
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="text-xs font-medium text-[#C62828] hover:text-[#B71C1C] px-2.5 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] rounded border border-[#FECACA] transition cursor-pointer"
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
