import React, { useRef, useState } from 'react'
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
  deletePlayerPhotoFn,
  getPlayerDetailFn,
  updatePlayerStatusFn,
  uploadPlayerPhotoFn,
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Photo management state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false)
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false)

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoError(null)

    // Check size limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError(`Ukuran berkas lebih dari 2MB. Harap pilih berkas lain.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Check type: JPEG, PNG, WebP
    const validMimes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validMimes.includes(file.type)) {
      setPhotoError(
        'Format berkas tidak didukung. gunakan format JPEG, PNG, atau WebP.',
      )
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploadingPhoto(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64String = reader.result as string
          await uploadPlayerPhotoFn({
            data: {
              playerId: player.id,
              fileBase64: base64String,
              fileName: file.name,
            },
          })
          await router.invalidate()
        } catch (err) {
          setPhotoError(
            err instanceof Error
              ? err.message
              : 'Gagal mengunggah foto profil.',
          )
        } finally {
          setIsUploadingPhoto(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      }
      reader.onerror = () => {
        setPhotoError('Gagal membaca berkas gambar dari perangkat.')
        setIsUploadingPhoto(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat unggah.',
      )
      setIsUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = async () => {
    setIsDeletingPhoto(true)
    try {
      await deletePlayerPhotoFn({
        data: { playerId: player.id },
      })
      setShowDeletePhotoModal(false)
      await router.invalidate()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus foto profil.')
    } finally {
      setIsDeletingPhoto(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar Photo Frame */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-[#cbd5e1] bg-gray-100 flex items-center justify-center shadow-xs">
              {player.photoDataUrl ? (
                <img
                  src={player.photoDataUrl}
                  alt={player.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#1b4d3e] text-white flex flex-col items-center justify-center font-bold text-2xl tracking-wider">
                  {player.fullName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Quick Upload Trigger */}
            <button
              type="button"
              disabled={isUploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-lg bg-white border border-[#cbd5e1] text-[#0F2C59] shadow-xs hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
              title={player.photoDataUrl ? 'Ganti Foto' : 'Unggah Foto'}
              aria-label={player.photoDataUrl ? 'Ganti Foto' : 'Unggah Foto'}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
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
                    player.status === 'active'
                      ? 'bg-emerald-600'
                      : 'bg-gray-500'
                  }`}
                />
                {player.status === 'active' ? 'Pemain Aktif' : 'Non-Aktif'}
              </span>
            </div>
            <p className="text-xs text-[#64748b]">
              ID Anggota:{' '}
              <code className="font-mono text-[#334155]">{player.id}</code>
            </p>

            {/* Photo Action Links */}
            <div className="flex items-center gap-2 pt-1">
              {player.photoDataUrl && (
                <button
                  type="button"
                  disabled={isUploadingPhoto}
                  onClick={() => setShowDeletePhotoModal(true)}
                  className="text-[11px] font-medium text-red-600 hover:underline cursor-pointer"
                >
                  Hapus Foto
                </button>
              )}
            </div>

            {photoError && (
              <div
                role="alert"
                className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2.5 py-1 mt-1 max-w-md"
              >
                {photoError}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isUpdatingStatus}
            onClick={handleToggleStatus}
            className="px-3 py-2 text-xs font-medium text-[#334155] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition disabled:opacity-50 cursor-pointer"
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
            className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition cursor-pointer"
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

            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Nomor Jersey
              </div>
              <div className="text-sm font-medium text-[#0f172a] mt-0.5">
                Belum tercatat
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
                Alamat
              </div>
              <div className="text-sm font-medium text-[#0f172a] mt-0.5 leading-relaxed">
                {player.address}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Nama Orang Tua/Wali
              </div>
              <div className="text-sm font-medium text-[#0f172a] mt-0.5 leading-relaxed">
                {player.parentName || 'Belum tercatat'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                No. Handphone Orang Tua/Wali
              </div>
              <div className="text-sm font-medium text-[#0f172a] mt-0.5 leading-relaxed">
                {player.parentPhone || 'Belum tercatat'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Photo Confirmation Modal */}
      {showDeletePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl border border-[#cbd5e1] shadow-xl max-w-sm w-full p-6 space-y-4">
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0f172a]">
                  Hapus Foto Profil?
                </h3>
                <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                  Foto profil pemain akan dihapus dari server privat. Tampilan
                  akan kembali menggunakan inisial nama pemain.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingPhoto}
                onClick={() => setShowDeletePhotoModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-[#334155] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingPhoto}
                onClick={handleDeletePhoto}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {isDeletingPhoto ? 'Menghapus...' : 'Ya, Hapus Foto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Player Confirmation Modal */}
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
                  Seluruh data pemain beserta foto profil akan dihapus secara
                  permanen.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-[#334155] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
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
