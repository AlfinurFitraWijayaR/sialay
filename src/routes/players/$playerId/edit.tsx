import React, { useRef, useState } from 'react'
import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { calculateAge, PLAYING_POSITIONS } from '../../../lib/player-utils'
import { getAuthSessionFn } from '../../../server/auth/actions'
import {
  deletePlayerPhotoFn,
  getPlayerDetailFn,
  updatePlayerFn,
  uploadPlayerPhotoFn,
} from '../../../server/players/actions'

export const Route = createFileRoute('/players/$playerId/edit')({
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
  component: EditPlayerPage,
})

function EditPlayerPage() {
  const { player } = Route.useLoaderData()
  const router = useRouter()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(player.fullName)
  const [placeOfBirth, setPlaceOfBirth] = useState(player.placeOfBirth)
  const [dateOfBirth, setDateOfBirth] = useState(player.dateOfBirth)
  const [address, setAddress] = useState(player.address)
  const [playingPosition, setPlayingPosition] = useState<string>(
    player.playingPosition,
  )
  const [parentName, setParentName] = useState(player.parentName || '')
  const [parentPhone, setParentPhone] = useState(player.parentPhone || '')
  const [joinDate, setJoinDate] = useState(player.joinDate || '')
  const [status, setStatus] = useState<'active' | 'inactive'>(
    player.status === 'inactive' ? 'inactive' : 'active',
  )

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Photo management state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false)
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false)

  const liveAge = calculateAge(dateOfBirth)

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoError(null)

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError(
        `Ukuran berkas (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimum 2MB.`,
      )
      if (photoInputRef.current) photoInputRef.current.value = ''
      return
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validMimes.includes(file.type)) {
      setPhotoError(
        'Format berkas tidak didukung. Harap pilih gambar JPEG, PNG, atau WebP.',
      )
      if (photoInputRef.current) photoInputRef.current.value = ''
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
              : 'Gagal memperbarui foto profil.',
          )
        } finally {
          setIsUploadingPhoto(false)
          if (photoInputRef.current) photoInputRef.current.value = ''
        }
      }
      reader.onerror = () => {
        setPhotoError('Gagal membaca berkas gambar.')
        setIsUploadingPhoto(false)
        if (photoInputRef.current) photoInputRef.current.value = ''
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat unggah.',
      )
      setIsUploadingPhoto(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
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
      alert(err instanceof Error ? err.message : 'Gagal menghapus foto.')
    } finally {
      setIsDeletingPhoto(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Nama lengkap pemain wajib diisi.')
      return
    }
    if (!placeOfBirth.trim()) {
      setError('Tempat lahir wajib diisi.')
      return
    }
    if (!dateOfBirth) {
      setError('Tanggal lahir wajib diisi.')
      return
    }
    if (!address.trim()) {
      setError('Alamat lengkap wajib diisi.')
      return
    }

    setIsSubmitting(true)
    try {
      await updatePlayerFn({
        data: {
          id: player.id,
          fullName,
          placeOfBirth,
          dateOfBirth,
          address,
          playingPosition,
          parentName: parentName.trim() || undefined,
          parentPhone: parentPhone.trim() || undefined,
          joinDate: joinDate || undefined,
          status,
        },
      })

      await router.invalidate()
      window.location.href = `/players/${player.id}`
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memperbarui data pemain.',
      )
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            to="/players/$playerId"
            params={{ playerId: player.id }}
            className="text-xs font-semibold text-[#0f172a] hover:text-[#972828] hover:underline"
          >
            ← Kembali ke Profil Pemain
          </Link>
        </div>
        <h1 className="text-xl font-bold text-[#0f172a] tracking-tight">
          Ubah Data Pemain
        </h1>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identitas Pribadi & Foto */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] border-b border-[#e2e8f0] pb-2">
            1. Biodata Pribadi Siswa
          </h2>
          {/* Profile Photo Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#cbd5e1] bg-white flex items-center justify-center shrink-0 shadow-2xs">
              {player.photoDataUrl ? (
                <img
                  src={player.photoDataUrl}
                  alt={player.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#972828] text-white flex items-center justify-center font-bold text-lg">
                  {player.fullName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUploadingPhoto}
                  onClick={() => photoInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium text-[#0f172a] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition cursor-pointer disabled:opacity-50"
                >
                  {isUploadingPhoto
                    ? 'Mengunggah...'
                    : player.photoDataUrl
                      ? 'Ganti Foto'
                      : 'Unggah Foto Profil'}
                </button>
                {player.photoDataUrl && (
                  <button
                    type="button"
                    disabled={isUploadingPhoto}
                    onClick={() => setShowDeletePhotoModal(true)}
                    className="px-2.5 py-1.5 text-xs font-medium text-[#972828] hover:bg-[#FEF2F2] rounded-lg border border-[#FECACA] transition cursor-pointer disabled:opacity-50"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <p className="text-[11px] text-[#64748b]">
                Format: JPG, PNG, atau WebP. Maks 2MB. Foto disimpan di storage
                privat.
              </p>
              {photoError && (
                <p className="text-[11px] text-[#972828] font-medium">
                  {photoError}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Nama Lengkap Pemain <span className="text-[#972828]">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              />
            </div>

            <div>
              <label
                htmlFor="placeOfBirth"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Tempat Lahir <span className="text-[#972828]">*</span>
              </label>
              <input
                id="placeOfBirth"
                type="text"
                required
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              />
            </div>

            <div>
              <label
                htmlFor="dateOfBirth"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Tanggal Lahir <span className="text-[#972828]">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="dateOfBirth"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
                />
                {dateOfBirth && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-[#FEF9C3] text-[#78350F] border border-[#FDE047] tabular-nums whitespace-nowrap">
                    {liveAge !== null ? `(${liveAge} Thn)` : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Alamat Tinggal Lengkap <span className="text-[#972828]">*</span>
              </label>
              <textarea
                id="address"
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              />
            </div>
            <div>
              <label
                htmlFor="parentName"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Nama Orang Tua / Wali{' '}
                <span className="text-gray-400 font-normal">(Opsional)</span>
              </label>
              <input
                id="parentName"
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Contoh: Ahmad Pratama"
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              />
            </div>

            <div>
              <label
                htmlFor="parentPhone"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Nomor Telepon / WhatsApp Orang Tua{' '}
                <span className="text-gray-400 font-normal">(Opsional)</span>
              </label>
              <input
                id="parentPhone"
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              />
            </div>
          </div>

          {/* Section 2: Data Keanggotaan & Sepak Bola */}
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] border-b border-[#e2e8f0] py-2">
            2. Posisi Lapangan & Status Keanggotaan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="playingPosition"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Posisi Bermain <span className="text-[#972828]">*</span>
              </label>
              <select
                id="playingPosition"
                value={playingPosition}
                onChange={(e) => setPlayingPosition(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              >
                {PLAYING_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="joinDate"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Tanggal Bergabung{' '}
                <span className="text-gray-400 font-normal">(Opsional)</span>
              </label>
              <input
                id="joinDate"
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Status Pemain <span className="text-[#972828]">*</span>
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'active' | 'inactive')
                }
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Non-Aktif</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#972828] text-xs flex items-start gap-2.5"
          >
            <svg
              className="w-4 h-4 text-[#972828] shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/players/$playerId"
            params={{ playerId: player.id }}
            className="px-4 py-2 text-xs font-medium text-[#334155] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-[#0f172a] bg-[#FBC02D] hover:bg-[#E5A800] rounded-lg shadow-sm transition border border-[#FDE047] disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FBC02D]"
          >
            {isSubmitting ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>

      {/* Delete Photo Confirmation Modal */}
      {showDeletePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl border border-[#cbd5e1] shadow-xl max-w-sm w-full p-6 space-y-4">
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
                className="px-4 py-2 text-xs font-semibold text-white bg-[#972828] hover:bg-[#B71C1C] rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {isDeletingPhoto ? 'Menghapus...' : 'Ya, Hapus Foto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
