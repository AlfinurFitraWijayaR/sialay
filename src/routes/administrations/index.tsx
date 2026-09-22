import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import type {
  DocStatus,
  PlayerAdministrationItem,
} from '../../server/administrations/actions'
import {
  getAdministrationsOverviewFn,
  quickToggleDocFn,
  savePlayerAdministrationFn,
} from '../../server/administrations/actions'
import { getAuthSessionFn } from '../../server/auth/actions'

interface SearchParams {
  search?: string
  status?: 'all' | 'lengkap' | 'belum_lengkap'
  page?: number
}

export const Route = createFileRoute('/administrations/')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      search: typeof search.search === 'string' ? search.search : undefined,
      status:
        search.status === 'lengkap' || search.status === 'belum_lengkap'
          ? search.status
          : 'all',
      page: Number(search.page) || 1,
    }
  },
  loaderDeps: ({ search }) => ({
    search: search.search,
    status: search.status,
    page: search.page,
  }),
  loader: async ({ deps }) => {
    const [overview, session] = await Promise.all([
      getAdministrationsOverviewFn({
        data: {
          search: deps.search,
          status: deps.status,
          page: deps.page,
        },
      }),
      getAuthSessionFn(),
    ])
    return { overview, session }
  },
  component: AdministrationsPage,
})

function AdministrationsPage() {
  const { overview } = Route.useLoaderData()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    'all' | 'lengkap' | 'belum_lengkap'
  >('all')

  // State Modal Edit Berkas
  const [activeModalItem, setActiveModalItem] =
    useState<PlayerAdministrationItem | null>(null)
  const [formReg, setFormReg] = useState<DocStatus>('belum_ada')
  const [formKk, setFormKk] = useState<DocStatus>('belum_ada')
  const [formAkte, setFormAkte] = useState<DocStatus>('belum_ada')
  const [formPhoto, setFormPhoto] = useState<DocStatus>('belum_ada')
  const [formNotes, setFormNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Quick Toggling feedback state
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  const openEditModal = (item: PlayerAdministrationItem) => {
    setActiveModalItem(item)
    setFormReg(item.administration.registrationForm)
    setFormKk(item.administration.familyCard)
    setFormAkte(item.administration.birthCertificate)
    setFormPhoto(item.administration.pasPhoto)
    setFormNotes(item.administration.notes || '')
    setSaveError(null)
  }

  const closeEditModal = () => {
    setActiveModalItem(null)
    setSaveError(null)
  }

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeModalItem) return

    setIsSaving(true)
    setSaveError(null)
    try {
      await savePlayerAdministrationFn({
        data: {
          playerId: activeModalItem.player.id,
          registrationForm: formReg,
          familyCard: formKk,
          birthCertificate: formAkte,
          pasPhoto: formPhoto,
          notes: formNotes,
        },
      })
      await router.invalidate()
      closeEditModal()
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan berkas administrasi',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleQuickToggle = async (
    playerId: string,
    docType:
      'registrationForm' | 'familyCard' | 'birthCertificate' | 'pasPhoto',
  ) => {
    const key = `${playerId}-${docType}`
    setTogglingKey(key)
    try {
      await quickToggleDocFn({
        data: {
          playerId,
          docType,
        },
      })
      await router.invalidate()
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Gagal memperbarui status dokumen',
      )
    } finally {
      setTogglingKey(null)
    }
  }

  const { stats, items } = overview

  // Filter lokal instan untuk kecepatan respons UI
  const displayItems = items.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      item.player.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      selectedStatusFilter === 'all' ||
      (selectedStatusFilter === 'lengkap'
        ? item.docSummary.isComplete
        : !item.docSummary.isComplete)
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0f172a] tracking-tight">
            Administrasi Siswa
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            Verifikasi dan pemantauan 4 berkas wajib pendaftaran siswa SSB
            Mundinglaya: Formulir, KK, Akte Kelahiran, dan Pas Photo.
          </p>
        </div>
        <Link
          to="/players"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#0f172a] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] transition shadow-xs self-start sm:self-auto"
        >
          <svg
            className="w-4 h-4 text-[#64748b]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Kelola Data Siswa
        </Link>
      </div>

      {/* Grid 4 Kartu KPI Statistik Administrasi */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Siswa Berkas Lengkap */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748b]">
              Berkas Lengkap (4/4)
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              {stats.completionRate}%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mt-2 tracking-tight">
            {stats.completeCount}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Memenuhi seluruh syarat
          </div>
        </div>

        {/* Card 2: Siswa Belum Lengkap */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748b]">
              Belum Lengkap
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-[#78350F] flex items-center justify-center font-bold text-xs">
              !
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#972828] mt-2 tracking-tight">
            {stats.incompleteCount}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FBC02D]"></span>
            Menunggu berkas susulan
          </div>
        </div>

        {/* Card 3: Total Siswa Terdata */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748b]">
              Total Siswa
            </span>
            <span className="w-8 h-8 rounded-lg bg-[#FEF9C3] text-[#78350F] flex items-center justify-center">
              <svg
                className="w-4 h-4 text-[#78350F]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mt-2 tracking-tight">
            {stats.totalPlayers}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">
            Target administrasi terpusat
          </div>
        </div>

        {/* Card 4: Ringkasan 4 Berkas Fisik */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-medium text-[#64748b]">
            Dokumen Fisik Terkumpul
          </span>
          <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px]">
            <div className="flex items-center justify-between bg-[#f8fafc] px-2 py-1 rounded">
              <span className="text-[#64748b]">Form:</span>
              <span className="font-bold text-[#0f172a]">
                {stats.docBreakdown.registrationForm}
              </span>
            </div>
            <div className="flex items-center justify-between bg-[#f8fafc] px-2 py-1 rounded">
              <span className="text-[#64748b]">KK:</span>
              <span className="font-bold text-[#0f172a]">
                {stats.docBreakdown.familyCard}
              </span>
            </div>
            <div className="flex items-center justify-between bg-[#f8fafc] px-2 py-1 rounded">
              <span className="text-[#64748b]">Akte:</span>
              <span className="font-bold text-[#0f172a]">
                {stats.docBreakdown.birthCertificate}
              </span>
            </div>
            <div className="flex items-center justify-between bg-[#f8fafc] px-2 py-1 rounded">
              <span className="text-[#64748b]">Foto:</span>
              <span className="font-bold text-[#0f172a]">
                {stats.docBreakdown.pasPhoto}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Pencarian Cepat */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tab Status Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-[#f1f5f9] rounded-xl self-start">
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              selectedStatusFilter === 'all'
                ? 'bg-white text-[#0f172a] shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Semua ({stats.totalPlayers})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('lengkap')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              selectedStatusFilter === 'lengkap'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Lengkap ({stats.completeCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('belum_lengkap')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              selectedStatusFilter === 'belum_lengkap'
                ? 'bg-[#972828] text-white shadow-xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Belum Lengkap ({stats.incompleteCount})
          </button>
        </div>

        {/* Input Pencarian Nama Siswa */}
        <div className="relative w-full sm:w-72">
          <svg
            className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama siswa..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#cbd5e1] focus:outline-hidden focus:border-[#FBC02D] focus:ring-2 focus:ring-[#FEF9C3] transition"
          />
        </div>
      </div>

      {/* Tabel Administrasi Siswa */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3.5">Siswa</th>
                <th className="px-3 py-3.5 text-center">Formulir</th>
                <th className="px-3 py-3.5 text-center">KK</th>
                <th className="px-3 py-3.5 text-center">Akte</th>
                <th className="px-3 py-3.5 text-center">Pas Photo</th>
                <th className="px-3 py-3.5 text-center">Kelengkapan</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {displayItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-[#64748b]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#FEF9C3] text-[#78350F] mx-auto flex items-center justify-center mb-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="font-semibold text-[#0f172a]">
                      Tidak ada data administrasi siswa
                    </p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      Coba ubah kata kunci pencarian atau filter status.
                    </p>
                  </td>
                </tr>
              ) : (
                displayItems.map((item) => {
                  const { player, administration, docSummary } = item
                  const isComplete = docSummary.isComplete

                  return (
                    <tr
                      key={player.id}
                      className="hover:bg-[#f8fafc]/80 transition group"
                    >
                      {/* Siswa Info */}
                      <td className="px-4 py-3">
                        <Link
                          to="/players/$playerId"
                          params={{ playerId: player.id }}
                          className="font-bold text-[#0f172a] hover:text-[#972828] transition block truncate max-w-[200px]"
                        >
                          {player.fullName}
                        </Link>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#64748b] mt-0.5">
                          <span className="font-medium text-[#78350F] bg-[#FEF9C3] px-1.5 py-0.2 rounded">
                            {player.ku}
                          </span>
                          <span>&bull;</span>
                          <span className="truncate">
                            {player.playingPosition}
                          </span>
                        </div>
                      </td>

                      {/* 1. Formulir Pendaftaran */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickToggle(player.id, 'registrationForm')
                          }
                          disabled={
                            togglingKey === `${player.id}-registrationForm`
                          }
                          title="Klik untuk mengubah status Formulir Pendaftaran"
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                            administration.registrationForm === 'ada'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {administration.registrationForm === 'ada' ? (
                            <>
                              <svg
                                className="w-3 h-3 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Ada</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>Belum</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 2. Kartu Keluarga (KK) */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickToggle(player.id, 'familyCard')
                          }
                          disabled={togglingKey === `${player.id}-familyCard`}
                          title="Klik untuk mengubah status Kartu Keluarga (KK)"
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                            administration.familyCard === 'ada'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {administration.familyCard === 'ada' ? (
                            <>
                              <svg
                                className="w-3 h-3 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Ada</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>Belum</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 3. Akte Kelahiran */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickToggle(player.id, 'birthCertificate')
                          }
                          disabled={
                            togglingKey === `${player.id}-birthCertificate`
                          }
                          title="Klik untuk mengubah status Akte Kelahiran"
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                            administration.birthCertificate === 'ada'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {administration.birthCertificate === 'ada' ? (
                            <>
                              <svg
                                className="w-3 h-3 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Ada</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>Belum</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 4. Pas Photo */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickToggle(player.id, 'pasPhoto')
                          }
                          disabled={togglingKey === `${player.id}-pasPhoto`}
                          title="Klik untuk mengubah status Pas Photo"
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                            administration.pasPhoto === 'ada'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {administration.pasPhoto === 'ada' ? (
                            <>
                              <svg
                                className="w-3 h-3 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Ada</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>Belum</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Status Kelengkapan Total */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isComplete
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-[#78350F]'
                          }`}
                        >
                          {isComplete
                            ? 'Lengkap (4/4)'
                            : `Belum (${docSummary.collectedCount}/4)`}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="px-2.5 py-1 text-xs font-semibold text-[#0f172a] bg-[#f1f5f9] hover:bg-[#FEF9C3] hover:text-[#78350F] rounded-lg transition"
                          >
                            Ubah
                          </button>
                          <Link
                            to="/players/$playerId"
                            params={{ playerId: player.id }}
                            className="p-1 text-[#64748b] hover:text-[#0f172a] rounded-lg transition"
                            title="Lihat Profil Siswa"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Berkas Administrasi Siswa */}
      {activeModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0f172a]">
                  Ubah Berkas Administrasi
                </h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Siswa:{' '}
                  <strong className="text-[#0f172a]">
                    {activeModalItem.player.fullName}
                  </strong>{' '}
                  ({activeModalItem.player.ku})
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="w-8 h-8 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] flex items-center justify-center transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-5 space-y-4">
              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {saveError}
                </div>
              )}

              <p className="text-xs text-[#475569]">
                Pilih status ketersediaan masing-masing berkas fisik yang telah
                diserahkan ke pengurus SSB:
              </p>

              {/* 4 Pilihan Berkas */}
              <div className="space-y-2.5">
                {/* 1. Formulir Pendaftaran */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
                  <div>
                    <div className="text-xs font-bold text-[#0f172a]">
                      1. Formulir Pendaftaran
                    </div>
                    <div className="text-[11px] text-[#64748b]">
                      Formulir pendaftaran fisik resmi yang ditandatangani
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormReg('belum_ada')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        formReg === 'belum_ada'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-white text-[#64748b] border border-[#cbd5e1] hover:bg-gray-50'
                      }`}
                    >
                      Belum Ada
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormReg('ada')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        formReg === 'ada'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-[#64748b] border border-[#cbd5e1] hover:bg-gray-50'
                      }`}
                    >
                      Ada
                    </button>
                  </div>
                </div>

                {/* 2. Kartu Keluarga (KK) */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
                  <div>
                    <div className="text-xs font-bold text-[#0f172a]">
                      2. Kartu Keluarga (KK)
                    </div>
                    <div className="text-[11px] text-[#64748b]">
                      Fotokopi atau salinan dokumen Kartu Keluarga
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormKk('belum_ada')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        formKk === 'belum_ada'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-white text-[#64748b] border border-[#cbd5e1] hover:bg-gray-50'
                      }`}
                    >
                      Belum Ada
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormKk('ada')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        formKk === 'ada'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-[#64748b] border border-[#cbd5e1] hover:bg-gray-50'
                      }`}
                    >
                      Ada
                    </button>
                  </div>
                </div>

                {/* 3. Akte Kelahiran */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
                  <div>
                    <div className="text-xs font-bold text-[#0f172a]">
                      3. Akte Kelahiran
                    </div>
                    <div className="text-[11px] text-[#64748b]">
                      Fotokopi Akte Kelahiran sebagai validasi usia (KU)
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormAkte('belum_ada')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        formAkte === 'belum_ada'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-white text-[#64748b] border border-[#cbd5e1] hover:bg-gray-50'
                      }`}
                    >
                      Belum Ada
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAkte('ada')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        formAkte === 'ada'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-[#64748b] border border-[#cbd5e1] hover:bg-gray-50'
                      }`}
                    >
                      Ada
                    </button>
                  </div>
                </div>

                {/* 4. Pas Photo */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
                  <div>
                    <div className="text-xs font-bold text-[#0f172a]">
                      4. Pas Photo
                    </div>
                    <div className="text-[11px] text-[#64748b]">
                      Pas photo cetak (3x4 / 4x6) berseragam atau pakaian rapi
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormPhoto('belum_ada')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        formPhoto === 'belum_ada'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-white text-[#64748b] border border-[#cbd5e1] hover:bg-gray-50'
                      }`}
                    >
                      Belum Ada
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPhoto('ada')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        formPhoto === 'ada'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-[#64748b] border border-[#cbd5e1] hover:bg-gray-50'
                      }`}
                    >
                      Ada
                    </button>
                  </div>
                </div>
              </div>

              {/* Catatan Berkas */}
              <div>
                <label className="block text-xs font-medium text-[#0f172a] mb-1">
                  Catatan Administrasi (Opsional)
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Contoh: Akte kelahiran susulan dijanjikan orang tua minggu depan..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#cbd5e1] focus:outline-hidden focus:border-[#FBC02D] focus:ring-2 focus:ring-[#FEF9C3] transition"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f1f5f9]">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#78350F] bg-[#FBC02D] hover:bg-[#f5b820] rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#78350F] border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Status Berkas</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
