import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardCharts } from '../components/dashboard/DashboardCharts'
import { getAuthSessionFn } from '../server/auth/actions'
import { getDashboardStatsFn } from '../server/dashboard/actions'
import { getSystemStatus } from '../server/db/status'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const admin = await getAuthSessionFn()
    if (!admin) {
      throw redirect({ to: '/login' })
    }
  },
  loader: async () => {
    const [stats, status, admin] = await Promise.all([
      getDashboardStatsFn(),
      getSystemStatus(),
      getAuthSessionFn(),
    ])
    return { stats, status, admin }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { stats, status } = Route.useLoaderData()
  const dbHealth = status.database

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-[#0f172a] tracking-tight">
          Admin Dashboard
        </h1>
      </div>

      {/* 4 Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card Siswa */}
        <Link
          to="/players"
          className="bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#FBC02D] rounded-2xl p-5 transition flex items-center justify-between shadow-xs group"
        >
          <div>
            <span className="text-xs font-medium text-[#64748b]">Siswa</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mt-1 tracking-tight">
              {stats.players.total}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FEF9C3] text-[#78350F] border border-[#FDE047]/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg
              className="w-6 h-6 text-[#78350F]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
        </Link>

        {/* Card Coach */}
        <Link
          to="/coaches"
          className="bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#C62828] rounded-2xl p-5 transition flex items-center justify-between shadow-xs group"
        >
          <div>
            <span className="text-xs font-medium text-[#64748b]">Coach</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mt-1 tracking-tight">
              {stats.coaches.total}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#C62828] border border-[#FECACA]/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg
              className="w-6 h-6 text-[#C62828]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="7" r="4" />
              <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              <path d="M12 11v4" />
              <path d="M10 15h4" />
            </svg>
          </div>
        </Link>

        {/* Card Administrasi Siswa */}
        <Link
          to="/players"
          className="bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#FBC02D] rounded-2xl p-5 transition flex items-center justify-between shadow-xs group"
        >
          <div>
            <span className="text-xs font-medium text-[#64748b]">
              Administrasi Siswa
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mt-1 tracking-tight">
              00
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FEF9C3] text-[#78350F] border border-[#FDE047]/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg
              className="w-6 h-6 text-[#78350F]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </Link>

        {/* Card Raport Siswa */}
        <Link
          to="/coaches"
          className="bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#C62828] rounded-2xl p-5 transition flex items-center justify-between shadow-xs group"
        >
          <div>
            <span className="text-xs font-medium text-[#64748b]">
              Raport Siswa
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mt-1 tracking-tight">
              00
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#C62828] border border-[#FECACA]/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg
              className="w-6 h-6 text-[#C62828]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Visual Data Charts (Tren Bulanan & Distribusi KU / Posisi) */}
      <DashboardCharts stats={stats} />

      {/* Database Diagnostic Card */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs">
        <h2 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[#C62828]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7M4 7c0-2 1.5-3 3.5-3h9c2 0 3.5 1 3.5 3M4 7c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3m-16 5c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3"
            />
          </svg>
          Status Database & Server
        </h2>

        {dbHealth.connected ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f8fafc] p-3.5 rounded-lg border border-[#e2e8f0]">
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Status
              </div>
              <div className="text-xs font-semibold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Connect
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Database Name
              </div>
              <div className="text-xs font-semibold text-[#0f172a] mt-0.5">
                {dbHealth.databaseName}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Response Latency
              </div>
              <div className="text-xs font-semibold text-[#0f172a] mt-0.5 tabular-nums">
                {dbHealth.latencyMs} ms
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            Database connection is lost. Please check your service
          </div>
        )}
      </div>
    </div>
  )
}
