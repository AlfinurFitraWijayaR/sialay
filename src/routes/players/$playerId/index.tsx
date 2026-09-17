import { useState } from 'react'
import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { formatIndonesianDate } from '../../../lib/player-utils'
import { getAuthSessionFn } from '../../../server/auth/actions'
import {
  deletePlayerFn,
  getPlayerDetailFn,
  updatePlayerStatusFn,
} from '../../../server/players/actions'

export const Route = createFileRoute('/players/$playerId/')({
  beforeLoad: async () => {
    const admin = await getAuthSessionFn()
    if (!admin) {
      throw redirect({ to: '/login' })
    }
  },
  loader: async ({ params: { playerId } }) => {
    const player = await getPlayerDetailFn({ data: { id: playerId } })
    if (!player) {
      throw new Error('Data pemain tidak ditemukan')
    }
    return { player }
  },
  component: PlayerDetailPage,
})

function PlayerDetailPage() {
  const { player } = Route.useLoaderData()
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const handleToggleStatus = async () => {
    const nextStatus = player.status === 'active' ? 'inactive' : 'active'
    setIsUpdatingStatus(true)
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
      setIsUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deletePlayerFn({ data: { id: player.id } })
      window.location.href = '/players'
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus pemain')
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/players"
              className="text-xs font-semibold text-[#0F2C59] hover:underline"
            >
              ← Kembali ke Daftar Pemain
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
              {player.fullName}
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold border ${
                player.status === 'active'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  player.status === 'active' ? 'bg-emerald-600' : 'bg-gray-500'
                }`}
              />
              {player.status === 'active' ? 'Pemain Aktif' : 'Non-Aktif'}
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-1">
            ID Anggota:{' '}
            <code className="font-mono text-[#334155]">{player.id}</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isUpdatingStatus}
            onClick={handleToggleStatus}
            className="px-3 py-2 text-xs font-medium text-[#334155] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition disabled:opacity-50"
          >
            {player.status === 'active' ? 'Ubah Non-Aktif' : 'Aktifkan Pemain'}
          </button>
          <Link
            to="/players/$playerId/edit"
            params={{ playerId: player.id }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0F2C59] hover:bg-[#1A365D] rounded-lg shadow-sm transition border border-[#0A1D3A]"
          >
            Edit Data
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition"
          >
            Hapus
          </button>
        </div>
      </div>

      {/* Main Details Sheet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Data Sepak Bola & Kelompok Usia */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F2C59] border-b border-[#e2e8f0] pb-2 flex items-center justify-between">
            <span>Profil Klub & Kelompok Usia</span>
            <span className="text-[10px] font-semibold bg-[#e8f5f1] text-[#143d32] px-2 py-0.5 rounded border border-[#bce3d6] tabular-nums">
              {player.ku}
            </span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Kelompok Usia (KU)
              </div>
              <div className="text-sm font-semibold text-[#0f172a] mt-0.5">
                {player.ku}
              </div>
              <div className="text-[10px] text-[#64748b] mt-0.5">
                Diturunkan dari tahun kelahiran (
                {new Date(player.dateOfBirth).getFullYear()})
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Posisi Bermain
              </div>
              <div className="text-sm font-semibold text-[#0f172a] mt-0.5">
                {player.playingPosition}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Tanggal Bergabung
              </div>
              <div className="text-sm font-medium text-[#0f172a] mt-0.5">
                {player.joinDate
                  ? formatIndonesianDate(player.joinDate)
                  : 'Belum tercatat'}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Identitas Pribadi */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F2C59] border-b border-[#e2e8f0] pb-2">
            Identitas & Domisili
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Tempat, Tanggal Lahir
              </div>
              <div className="text-sm font-semibold text-[#0f172a] mt-0.5">
                {player.placeOfBirth},{' '}
                {formatIndonesianDate(player.dateOfBirth)}
                {player.age !== null && (
                  <span className="text-xs font-normal text-[#64748b] ml-1.5 tabular-nums">
                    ({player.age} tahun)
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Alamat Tinggal
              </div>
              <div className="text-sm font-medium text-[#0f172a] mt-0.5 leading-relaxed">
                {player.address}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Orang Tua / Wali */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-4 md:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F2C59] border-b border-[#e2e8f0] pb-2">
            Kontak Orang Tua / Wali
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Nama Orang Tua / Wali
              </div>
              <div className="text-sm font-semibold text-[#0f172a] mt-0.5">
                {player.parentName}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Nomor Telepon / WhatsApp
              </div>
              <div className="text-sm font-semibold text-[#0F2C59] mt-0.5 tabular-nums flex items-center gap-2">
                <span>{player.parentPhone}</span>
                <a
                  href={`tel:${player.parentPhone}`}
                  className="text-[11px] text-[#0F2C59] hover:underline"
                >
                  (Hubungi)
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl border border-[#cbd5e1] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
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
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0f172a]">
                  Hapus Data Pemain
                </h3>
                <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data pemain{' '}
                  <strong className="text-[#0f172a]">{player.fullName}</strong>?
                  Seluruh catatan data pemain ini akan dihapus dari database.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-[#334155] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
