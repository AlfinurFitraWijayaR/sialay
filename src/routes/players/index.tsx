import { useEffect, useState } from 'react'
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { formatIndonesianDate } from '../../lib/player-utils'
import { getAuthSessionFn } from '../../server/auth/actions'
import type { PlayerListItem } from '../../server/players/actions'
import {
  deletePlayerFn,
  getPlayersFn,
  updatePlayerStatusFn,
} from '../../server/players/actions'

export interface PlayerSearchSchema {
  page?: number
  search?: string
  status?: 'active' | 'inactive'
  birthYear?: number
}

export const Route = createFileRoute('/players/')({
  validateSearch: (search: Record<string, unknown>): PlayerSearchSchema => ({
    page: search.page ? Number(search.page) : undefined,
    search:
      typeof search.search === 'string' && search.search.trim() !== ''
        ? search.search.trim()
        : undefined,
    status:
      search.status === 'active' || search.status === 'inactive'
        ? search.status
        : undefined,
    birthYear:
      search.birthYear && !isNaN(Number(search.birthYear))
        ? Number(search.birthYear)
        : undefined,
  }),
  beforeLoad: async () => {
    const admin = await getAuthSessionFn()
    if (!admin) {
      throw redirect({ to: '/login' })
    }
  },
  loaderDeps: ({ search: { page, search, status, birthYear } }) => ({
    page: page || 1,
    search: search || '',
    status,
    birthYear,
  }),
  loader: async ({ deps }) => {
    return await getPlayersFn({
      data: {
        page: deps.page,
        search: deps.search || undefined,
        status: deps.status,
        birthYear: deps.birthYear,
      },
    })
  },
  component: PlayerListPage,
})

function PlayerListPage() {
  const { players, totalCount, page, totalPages, availableBirthYears } =
    Route.useLoaderData()
  const searchParams = Route.useSearch()
  const router = useRouter()
  const navigate = useNavigate({ from: Route.fullPath })

  const [searchInput, setSearchInput] = useState(searchParams.search || '')
  const [playerToDelete, setPlayerToDelete] = useState<PlayerListItem | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  // Sinkronisasi input pencarian saat query URL search berubah
  useEffect(() => {
    setSearchInput(searchParams.search || '')
  }, [searchParams.search])

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const clean = searchInput.trim()
    navigate({
      search: (prev) => ({
        ...prev,
        page: 1,
        search: clean || undefined,
      }),
    })
  }

  const handleStatusChange = (status: 'active' | 'inactive' | 'all') => {
    navigate({
      search: (prev) => ({
        ...prev,
        page: 1,
        status: status === 'all' ? undefined : status,
      }),
    })
  }

  const handleBirthYearChange = (yearVal: string) => {
    const year = yearVal ? Number(yearVal) : undefined
    navigate({
      search: (prev) => ({
        ...prev,
        page: 1,
        birthYear: year && !isNaN(year) ? year : undefined,
      }),
    })
  }

  const handleResetFilters = () => {
    setSearchInput('')
    navigate({
      search: () => ({
        page: 1,
      }),
    })
  }

  const hasActiveFilters = Boolean(
    searchParams.search || searchParams.status || searchParams.birthYear,
  )

  const handleToggleStatus = async (player: PlayerListItem) => {
    const nextStatus = player.status === 'active' ? 'inactive' : 'active'
    setStatusUpdatingId(player.id)
    try {
      await updatePlayerStatusFn({
        data: {
          id: player.id,
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
    if (!playerToDelete) return
    setIsDeleting(true)
    try {
      await deletePlayerFn({ data: { id: playerToDelete.id } })
      setPlayerToDelete(null)
      await router.invalidate()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus pemain')
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
            Daftar Pemain
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">
            Pengelolaan biodata pemain, kelompok usia (KU), kontak orang tua,
            dan status keaktifan.
          </p>
        </div>

        <div>
          <Link
            to="/players/create"
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
            <span>Tambah Pemain Baru</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar (F06) */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search by Name */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 min-w-[220px]"
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94a3b8]">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama pemain..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  navigate({
                    search: (prev) => ({ ...prev, page: 1, search: undefined }),
                  })
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#94a3b8] hover:text-[#475569] cursor-pointer"
                title="Hapus pencarian"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </form>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#f1f5f9] p-1 rounded-lg border border-[#e2e8f0] shrink-0">
            <button
              type="button"
              onClick={() => handleStatusChange('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                !searchParams.status
                  ? 'bg-white text-[#0f172a] shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Semua Status
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                searchParams.status === 'active'
                  ? 'bg-[#FBC02D] text-[#0f172a] shadow-xs font-bold'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Aktif
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('inactive')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                searchParams.status === 'inactive'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Non-Aktif
            </button>
          </div>

          {/* KU / Birth Year Filter */}
          <div className="min-w-[180px] shrink-0">
            <select
              value={
                searchParams.birthYear ? String(searchParams.birthYear) : ''
              }
              onChange={(e) => handleBirthYearChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D] cursor-pointer"
            >
              <option value="">Semua Kelompok Usia (KU)</option>
              {availableBirthYears.map((year) => (
                <option key={year} value={year}>
                  KU {year} (Lahir {year})
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button
            type="button"
            onClick={() => handleSearchSubmit()}
            className="px-4 py-2 bg-[#FBC02D] hover:bg-[#E5A800] text-[#0f172a] text-xs font-semibold rounded-lg shadow-sm transition border border-[#FDE047] cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-[#FBC02D]"
          >
            Cari
          </button>
        </div>

        {/* Active Filters & Counter */}
        <div className="pt-2.5 border-t border-[#f1f5f9] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[#64748b] text-[11px]">
              Menampilkan{' '}
              <strong className="text-[#0f172a] font-semibold tabular-nums">
                {players.length}
              </strong>{' '}
              dari total{' '}
              <strong className="text-[#0f172a] font-semibold tabular-nums">
                {totalCount}
              </strong>{' '}
              pemain
            </span>

            {hasActiveFilters && (
              <>
                <span className="text-gray-300 mx-1">•</span>
                <span className="text-[#64748b] text-[11px] font-medium">
                  Filter aktif:
                </span>
                {searchParams.search && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#e2e8f0] text-[#1e293b]">
                    <span>Nama: "{searchParams.search}"</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput('')
                        navigate({
                          search: (prev) => ({
                            ...prev,
                            page: 1,
                            search: undefined,
                          }),
                        })
                      }}
                      className="hover:text-[#972828] cursor-pointer font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchParams.status && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#e2e8f0] text-[#1e293b]">
                    <span>
                      Status:{' '}
                      {searchParams.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          search: (prev) => ({
                            ...prev,
                            page: 1,
                            status: undefined,
                          }),
                        })
                      }
                      className="hover:text-[#972828] cursor-pointer font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchParams.birthYear && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#e2e8f0] text-[#1e293b]">
                    <span>KU {searchParams.birthYear}</span>
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          search: (prev) => ({
                            ...prev,
                            page: 1,
                            birthYear: undefined,
                          }),
                        })
                      }
                      className="hover:text-[#972828] cursor-pointer font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )}
              </>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#972828] hover:text-[#B71C1C] hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm overflow-hidden">
        {players.length === 0 ? (
          hasActiveFilters ? (
            /* Empty State for Filter Result */
            <div className="p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#f8fafc] text-[#64748b] flex items-center justify-center border border-[#e2e8f0]">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-[#0f172a] mb-1">
                Tidak Ada Pemain yang Cocok
              </h3>
              <p className="text-xs text-[#64748b] max-w-sm mx-auto mb-5 leading-relaxed">
                Tidak ditemukan data pemain yang sesuai dengan kriteria
                pencarian atau filter yang dipilih. Silakan sesuaikan kata kunci
                atau reset filter.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#FBC02D] hover:bg-[#E5A800] text-[#0f172a] text-xs font-semibold rounded-lg shadow-sm transition border border-[#FDE047] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FBC02D]"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            /* Empty State for truly empty database */
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-[#0f172a] mb-1">
                Belum Ada Data Pemain
              </h3>
              <p className="text-xs text-[#64748b] max-w-sm mx-auto mb-5 leading-relaxed">
                Database pemain saat ini masih kosong. Daftarkan pemain pertama
                untuk memulai pencatatan administrasi klub.
              </p>
              <Link
                to="/players/create"
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
                <span>Daftarkan Pemain Pertama</span>
              </Link>
            </div>
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-[#475569] uppercase font-semibold text-[11px] border-b border-[#e2e8f0]">
                  <tr>
                    <th scope="col" className="py-3.5 px-4">
                      Nama Lengkap
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      Posisi
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      Kelompok Usia
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      TTL
                    </th>
                    <th scope="col" className="py-3.5 px-4">
                      Administrasi
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
                  {players.map((player) => {
                    return (
                      <tr
                        key={player.id}
                        className="hover:bg-[#f8fafc]/80 transition"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-[#cbd5e1] bg-gray-100 flex items-center justify-center shadow-2xs">
                              {player.photoDataUrl ? (
                                <img
                                  src={player.photoDataUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-[#1b4d3e] text-white flex items-center justify-center font-bold text-[11px]">
                                  {player.fullName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to="/players/$playerId"
                                params={{ playerId: player.id }}
                                className="font-semibold text-[#0F2C59] hover:underline block truncate"
                              >
                                {player.fullName}
                              </Link>
                              <div className="text-[11px] text-[#64748b] truncate max-w-xs">
                                {player.address}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1]">
                            {player.playingPosition}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#e8f5f1] text-[#143d32] border border-[#bce3d6] tabular-nums">
                            {player.age} Tahun
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#334155]">
                          <div>{player.placeOfBirth}</div>
                          <div className="text-[11px] text-[#64748b] tabular-nums">
                            {formatIndonesianDate(player.dateOfBirth)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to="/administrations"
                            search={{ search: player.fullName }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                              player.administration?.status === 'lengkap'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                            }`}
                            title={
                              player.administration?.status === 'lengkap'
                                ? 'Administrasi lengkap. Klik untuk lihat berkas'
                                : 'Administrasi belum lengkap. Klik untuk kelola berkas'
                            }
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                player.administration?.status === 'lengkap'
                                  ? 'bg-emerald-600'
                                  : 'bg-rose-600'
                              }`}
                            />
                            <span>
                              {player.administration?.status === 'lengkap'
                                ? 'Sudah'
                                : 'Belum'}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            disabled={statusUpdatingId === player.id}
                            onClick={() => handleToggleStatus(player)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                              player.status === 'active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            }`}
                            title="Klik untuk mengubah status"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                player.status === 'active'
                                  ? 'bg-emerald-600'
                                  : 'bg-gray-500'
                              }`}
                            />
                            <span>
                              {player.status === 'active'
                                ? 'Aktif'
                                : 'Non-Aktif'}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to="/players/$playerId"
                              params={{ playerId: player.id }}
                              className="px-2 py-1 text-xs font-medium text-[#0f172a] hover:bg-[#FEF9C3] rounded border border-[#cbd5e1] transition"
                            >
                              Detail
                            </Link>
                            <button
                              type="button"
                              onClick={() => setPlayerToDelete(player)}
                              className="px-2 py-1 text-xs font-medium text-[#972828] hover:bg-[#FEF2F2] rounded border border-[#FECACA] transition cursor-pointer"
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

            {/* Pagination with search parameters preservation */}
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
                  to="/players"
                  search={{
                    ...searchParams,
                    page: Math.max(1, page - 1),
                  }}
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
                  to="/players"
                  search={{
                    ...searchParams,
                    page: Math.min(totalPages, page + 1),
                  }}
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
      {playerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl border border-[#cbd5e1] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#972828] flex items-center justify-center shrink-0">
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0f172a]">
                  Hapus Data Pemain?
                </h3>
                <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                  Tindakan ini akan menghapus data{' '}
                  <strong className="text-[#0f172a]">
                    {playerToDelete.fullName}
                  </strong>{' '}
                  secara permanen dari sistem.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPlayerToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-[#334155] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#972828] hover:bg-[#B71C1C] rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Pemain'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
