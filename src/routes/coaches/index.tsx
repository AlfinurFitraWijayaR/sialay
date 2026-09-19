import { useState } from 'react'
import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { getAuthSessionFn } from '../../server/auth/actions'
import type { CoachListItem } from '../../server/coaches/actions'
import {
  deleteCoachFn,
  getCoachesFn,
  updateCoachStatusFn,
} from '../../server/coaches/actions'

export interface CoachSearchSchema {
  page?: number
}

export const Route = createFileRoute('/coaches/')({
  validateSearch: (search: Record<string, unknown>): CoachSearchSchema => ({
    page: search.page ? Number(search.page) : undefined,
  }),
  beforeLoad: async () => {
    const admin = await getAuthSessionFn()
    if (!admin) {
      throw redirect({ to: '/login' })
    }
  },
  loaderDeps: ({ search: { page } }) => ({
    page: page || 1,
  }),
  loader: async ({ deps }) => {
    return await getCoachesFn({
      data: {
        page: deps.page,
      },
    })
  },
  component: CoachListPage,
})

function CoachListPage() {
  const { coaches, totalCount, page, totalPages } = Route.useLoaderData()
  const router = useRouter()
  const [coachToDelete, setCoachToDelete] = useState<CoachListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  const handleToggleStatus = async (coach: CoachListItem) => {
    const nextStatus = coach.status === 'active' ? 'inactive' : 'active'
    setStatusUpdatingId(coach.id)
    try {
      await updateCoachStatusFn({
        data: {
          id: coach.id,
          status: nextStatus,
        },
      })
      await router.invalidate()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal memperbarui status')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!coachToDelete) return
    setIsDeleting(true)
    try {
      await deleteCoachFn({ data: { id: coachToDelete.id } })
      setCoachToDelete(null)
      await router.invalidate()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus pelatih')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] tracking-tight">
            Daftar Pelatih
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">
            Pengelolaan biodata pelatih, kontak resmi, alamat, dan status keaktifan di klub.
          </p>
        </div>

        <div>
          <Link
            to="/coaches/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FBC02D] hover:bg-[#E5A800] text-[#0f172a] text-xs font-semibold rounded-lg shadow-sm transition border border-[#FDE047] focus:outline-none focus:ring-2 focus:ring-[#FBC02D]"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Tambah Pelatih Baru</span>
          </Link>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm overflow-hidden">
        {coaches.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center border border-[#e2e8f0]">
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-[#0f172a] mb-1">
              Belum Ada Data Pelatih
            </h3>
            <p className="text-xs text-[#64748b] max-w-sm mx-auto mb-5 leading-relaxed">
              Database pelatih saat ini masih kosong. Daftarkan pelatih pertama klub untuk memulai pencatatan manajemen tim kepelatihan.
            </p>
            <Link
              to="/coaches/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FBC02D] hover:bg-[#E5A800] text-[#0f172a] text-xs font-semibold rounded-lg shadow-sm transition border border-[#FDE047] focus:outline-none focus:ring-2 focus:ring-[#FBC02D]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Daftarkan Pelatih Pertama</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] text-xs text-[#64748b]">
              Menampilkan{' '}
              <strong className="text-[#0f172a] font-semibold tabular-nums">
                {coaches.length}
              </strong>{' '}
              dari total{' '}
              <strong className="text-[#0f172a] font-semibold tabular-nums">
                {totalCount}
              </strong>{' '}
              pelatih
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-[#475569] uppercase font-semibold text-[11px] border-b border-[#e2e8f0]">
                  <tr>
                    <th scope="col" className="py-3.5 px-4 w-12 text-center">
                      No
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      Nama Pelatih
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      Kontak / Telepon
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      Alamat
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      Status
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {coaches.map((coach, idx) => {
                    const rowNumber = (page - 1) * 15 + idx + 1
                    return (
                      <tr
                        key={coach.id}
                        className="hover:bg-[#f8fafc]/80 transition"
                      >
                        <td className="py-3 px-4 text-center tabular-nums text-[#64748b] font-medium">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-[#cbd5e1] bg-gray-100 flex items-center justify-center shadow-2xs">
                              {coach.photoDataUrl ? (
                                <img
                                  src={coach.photoDataUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-[#C62828] text-white flex items-center justify-center font-bold text-[11px]">
                                  {coach.fullName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to="/coaches/$coachId"
                                params={{ coachId: coach.id }}
                                className="font-semibold text-[#0f172a] hover:text-[#C62828] hover:underline block truncate"
                              >
                                {coach.fullName}
                              </Link>
                              <div className="text-[11px] text-[#64748b] truncate max-w-xs">
                                ID: <span className="font-mono">{coach.id.slice(0, 8)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#334155] tabular-nums">
                          <a
                            href={`tel:${coach.phone}`}
                            className="hover:underline text-[#0f172a] hover:text-[#C62828] font-medium"
                          >
                            {coach.phone}
                          </a>
                        </td>
                        <td className="py-3 px-4 text-[#334155] max-w-xs truncate">
                          {coach.address}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            disabled={statusUpdatingId === coach.id}
                            onClick={() => handleToggleStatus(coach)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                              coach.status === 'active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            }`}
                            title="Klik untuk mengubah status"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                coach.status === 'active'
                                  ? 'bg-emerald-600'
                                  : 'bg-gray-500'
                              }`}
                            />
                            <span>
                              {coach.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to="/coaches/$coachId"
                              params={{ coachId: coach.id }}
                              className="px-2 py-1 text-xs font-medium text-[#0f172a] hover:bg-[#FEF9C3] rounded border border-[#cbd5e1] transition"
                            >
                              Detail
                            </Link>
                            <Link
                              to="/coaches/$coachId/edit"
                              params={{ coachId: coach.id }}
                              className="px-2 py-1 text-xs font-medium text-[#334155] hover:bg-[#f1f5f9] rounded border border-[#cbd5e1] transition"
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => setCoachToDelete(coach)}
                              className="px-2 py-1 text-xs font-medium text-[#C62828] hover:bg-[#FEF2F2] rounded border border-[#FECACA] transition cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between">
              <div className="text-xs text-[#64748b]">
                Halaman{' '}
                <span className="font-semibold text-[#0f172a] tabular-nums">
                  {page}
                </span>{' '}
                dari{' '}
                <span className="font-semibold text-[#0f172a] tabular-nums">
                  {totalPages}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/coaches"
                  search={{ page: Math.max(1, page - 1) }}
                  disabled={page <= 1}
                  className={`px-3 py-1.5 text-xs font-medium rounded border transition ${
                    page <= 1
                      ? 'bg-gray-100 text-gray-400 border-gray-200 pointer-events-none'
                      : 'bg-white text-[#334155] border-[#cbd5e1] hover:bg-gray-50'
                  }`}
                >
                  Sebelumnya
                </Link>
                <Link
                  to="/coaches"
                  search={{ page: Math.min(totalPages, page + 1) }}
                  disabled={page >= totalPages}
                  className={`px-3 py-1.5 text-xs font-medium rounded border transition ${
                    page >= totalPages
                      ? 'bg-gray-100 text-gray-400 border-gray-200 pointer-events-none'
                      : 'bg-white text-[#334155] border-[#cbd5e1] hover:bg-gray-50'
                  }`}
                >
                  Selanjutnya
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {coachToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl border border-[#cbd5e1] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#C62828] flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0f172a]">
                  Konfirmasi Penghapusan Pelatih
                </h3>
                <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data pelatih{' '}
                  <strong className="text-[#0f172a] font-semibold">
                    {coachToDelete.fullName}
                  </strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCoachToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-[#334155] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#C62828] hover:bg-[#B71C1C] rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Pelatih'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
