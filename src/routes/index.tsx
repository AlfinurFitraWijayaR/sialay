import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardCharts } from '../components/dashboard/DashboardCharts'
import { getAuthSessionFn } from '../server/auth/actions'
import { getDashboardStatsFn } from '../server/dashboard/actions'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const admin = await getAuthSessionFn()
    if (!admin) {
      throw redirect({ to: '/login' })
    }
  },
  loader: async () => {
    const stats = await getDashboardStatsFn()
    return { stats }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { stats } = Route.useLoaderData()

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
          className="bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#972828] rounded-2xl p-5 transition flex items-center justify-between shadow-xs group"
        >
          <div>
            <span className="text-xs font-medium text-[#64748b]">Coach</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mt-1 tracking-tight">
              {stats.coaches.total}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#972828] border border-[#FECACA]/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg
              className="w-6 h-6 text-[#972828]"
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
          to="/administrations"
          className="bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#FBC02D] rounded-2xl p-5 transition flex items-center justify-between shadow-xs group"
        >
          <div>
            <span className="text-xs font-medium text-[#64748b]">
              Administrasi
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mt-1 tracking-tight flex items-baseline gap-1">
              <span>{stats.administrations.complete}</span>
              <span className="text-xs font-medium text-[#64748b]">
                / {stats.players.total}
              </span>
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
          className="bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#972828] rounded-2xl p-5 transition flex items-center justify-between shadow-xs group"
        >
          <div>
            <span className="text-xs font-medium text-[#64748b]">
              Raport Siswa
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mt-1 tracking-tight">
              00
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#972828] border border-[#FECACA]/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg
              className="w-6 h-6 text-[#972828]"
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
    </div>
  )
}
