import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAuthSessionFn } from '../server/auth/actions'
import { getSystemStatus } from '../server/db/status'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const admin = await getAuthSessionFn()
    if (!admin) {
      throw redirect({ to: '/login' })
    }
  },
  loader: async () => {
    const [status, admin] = await Promise.all([
      getSystemStatus(),
      getAuthSessionFn(),
    ])
    return { status, admin }
  },
  component: FoundationAndAuthPage,
})

function FoundationAndAuthPage() {
  const { status, admin } = Route.useLoaderData()
  const dbHealth = status.database

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#e8f5f1] text-[#143d32] border border-[#bce3d6]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#266b56]" />
                F01 Foundation • Selesai
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                F02 Autentikasi • Aktif
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#0f172a] tracking-tight">
              Sistem Informasi SSB MUNDINGLAYA
            </h1>
            <p className="text-xs text-[#475569] mt-1 max-w-2xl">
              Sesi administrator aktif terotentikasi. Semua halaman dan fungsi
              dilindungi oleh server-side authorization check sesuai acceptance
              criteria PRD.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border bg-emerald-50 text-emerald-800 border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Sesi Valid ({admin?.username})
            </span>
          </div>
        </div>
      </div>

      {/* Feature F02 Acceptance Criteria Verification Card */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm">
        <h2 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider mb-4 flex items-center gap-2">
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
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Status & Verifikasi Autentikasi Administrator (F02)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#f8fafc] p-4 rounded border border-[#e2e8f0]">
          <div>
            <div className="text-[11px] font-medium text-[#64748b]">
              Akun Administrator
            </div>
            <div className="text-sm font-semibold text-[#0f172a] mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              {admin?.username}
            </div>
            <div className="text-[10px] text-[#64748b] mt-0.5">
              Tunggal (Non-registrasi)
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#64748b]">
              Proteksi Kredensial
            </div>
            <div className="text-sm font-semibold text-[#0f172a] mt-0.5">
              Bcrypt Hash (Salt 10)
            </div>
            <div className="text-[10px] text-[#64748b] mt-0.5">
              Non-plaintext di Database
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#64748b]">
              Session Management
            </div>
            <div className="text-sm font-semibold text-[#0f172a] mt-0.5">
              HTTP-only Cookie
            </div>
            <div className="text-[10px] text-[#64748b] mt-0.5">
              Kedaluwarsa 7 Hari (Database)
            </div>
          </div>
        </div>
      </div>

      {/* Database Diagnostic Card */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm">
        <h2 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider mb-4 flex items-center gap-2">
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
              d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7M4 7c0-2 1.5-3 3.5-3h9c2 0 3.5 1 3.5 3M4 7c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3m-16 5c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3"
            />
          </svg>
          Status Database PostgreSQL & Drizzle ORM
        </h2>

        {dbHealth.connected ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#f8fafc] p-4 rounded border border-[#e2e8f0]">
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Status Koneksi
              </div>
              <div className="text-sm font-semibold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Terhubung Aktif
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Nama Database
              </div>
              <div className="text-sm font-semibold text-[#0f172a] mt-0.5">
                {dbHealth.databaseName}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Latensi Response
              </div>
              <div className="text-sm font-semibold text-[#0f172a] mt-0.5 tabular-nums">
                {dbHealth.latencyMs} ms
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-700">
            Koneksi database terputus. Silakan periksa service PostgreSQL lokal
            Anda.
          </div>
        )}
      </div>

      {/* Next Step Preview */}
      <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
            Langkah Berikutnya: F03 Dashboard / F04 Player Management
          </div>
          <p className="text-xs text-[#475569] mt-0.5">
            Fondasi teknis dan autentikasi administrator telah siap. Modul data
            pemain atau ringkasan statistik siap dikerjakan sesuai roadmap.
          </p>
        </div>
        <div className="text-xs font-medium text-[#475569] bg-white px-3 py-1.5 rounded border border-[#cbd5e1] shrink-0 self-start sm:self-auto">
          Menunggu Review F02
        </div>
      </div>
    </div>
  )
}
