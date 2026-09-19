import React, { useRef, useState } from 'react'
import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import {
  calculateAge,
  calculateKU,
  PLAYING_POSITIONS,
} from '../../lib/player-utils'
import { getAuthSessionFn } from '../../server/auth/actions'
import { createPlayerFn } from '../../server/players/actions'

export const Route = createFileRoute('/players/create')({
  beforeLoad: async () => {
    const admin = await getAuthSessionFn()
    if (!admin) {
      throw redirect({ to: '/login' })
    }
  },
  component: CreatePlayerPage,
})

function CreatePlayerPage() {
  const router = useRouter()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState('')
  const [placeOfBirth, setPlaceOfBirth] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [address, setAddress] = useState('')
  const [playingPosition, setPlayingPosition] = useState<string>(
    PLAYING_POSITIONS[0],
  )
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [joinDate, setJoinDate] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')

  // Photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const liveKU = calculateKU(dateOfBirth)
  const liveAge = calculateAge(dateOfBirth)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoError(null)

    // Check size limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError(
        `Ukuran berkas (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimum 2MB. Silakan pilih berkas lebih kecil.`,
      )
      if (photoInputRef.current) photoInputRef.current.value = ''
      return
    }

    // Check mime type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validMimes.includes(file.type)) {
      setPhotoError(
        'Format berkas tidak didukung. Harap pilih gambar dengan format JPEG, PNG, atau WebP.',
      )
      if (photoInputRef.current) photoInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setPhotoPreview(dataUrl)
      setPhotoBase64(dataUrl)
    }
    reader.onerror = () => {
      setPhotoError('Gagal membaca berkas gambar.')
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleClearPhoto = () => {
    setPhotoPreview(null)
    setPhotoBase64(null)
    setPhotoError(null)
    if (photoInputRef.current) photoInputRef.current.value = ''
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
      const res = await createPlayerFn({
        data: {
          fullName,
          placeOfBirth,
          dateOfBirth,
          address,
          playingPosition,
          parentName: parentName || undefined,
          parentPhone: parentPhone || undefined,
          joinDate: joinDate || undefined,
          status,
          photoBase64: photoBase64 || undefined,
        },
      })

      await router.invalidate()
      window.location.href = `/players/${res.id}`
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menyimpan data pemain.',
      )
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/players"
              className="text-xs font-semibold text-[#0f172a] hover:text-[#C62828] hover:underline"
            >
              ← Kembali ke Daftar Pemain
            </Link>
          </div>
          <h1 className="text-xl font-bold text-[#0f172a] tracking-tight">
            Tambah Pemain Baru
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">
            Lengkapi formulir pendaftaran pemain SSB MUNDINGLAYA. Kelompok usia
            (KU) dihitung otomatis.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identitas Pribadi & Foto */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] border-b border-[#e2e8f0] pb-2">
            1. Biodata Pribadi Pemain & Foto Profil
          </h2>

          {/* Optional Profile Photo Selector */}
          <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
            <div className="text-xs font-semibold text-[#334155] mb-2">
              Foto Profil Pemain{' '}
              <span className="text-[#64748b] font-normal">(Opsional)</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#cbd5e1] bg-white flex items-center justify-center shrink-0 shadow-2xs">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Pratinjau foto profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-gray-400">
                    <svg
                      className="w-7 h-7 mx-auto stroke-current"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-[9px] block leading-tight mt-0.5">
                      Belum ada
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium text-[#0f172a] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition cursor-pointer"
                  >
                    {photoPreview ? 'Ganti Berkas Foto' : 'Pilih Berkas Foto'}
                  </button>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      className="px-2.5 py-1.5 text-xs font-medium text-[#C62828] hover:bg-[#FEF2F2] rounded-lg border border-[#FECACA] transition cursor-pointer"
                    >
                      Hapus Pilihan
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
                  Format berkas: JPG, PNG, atau WebP. Ukuran maksimal 2MB.
                  Tersimpan di storage privat terproteksi.
                </p>
                {photoError && (
                  <p className="text-[11px] text-[#C62828] font-medium">
                    {photoError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Nama Lengkap Pemain <span className="text-[#C62828]">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Muhammad Rizky Pratama"
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              />
            </div>

            <div>
              <label
                htmlFor="placeOfBirth"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Tempat Lahir <span className="text-[#C62828]">*</span>
              </label>
              <input
                id="placeOfBirth"
                type="text"
                required
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
                placeholder="Contoh: Bandung"
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              />
            </div>

            <div>
              <label
                htmlFor="dateOfBirth"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Tanggal Lahir <span className="text-[#C62828]">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="dateOfBirth"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
                />
              </div>

              {/* Dynamic live preview of KU badge (PRD Rule) */}
              {dateOfBirth && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[11px] text-[#64748b]">
                    Pratinjau Kelompok Usia:
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF9C3] text-[#78350F] border border-[#FDE047] tabular-nums">
                    {liveKU} {liveAge !== null ? `(${liveAge} thn)` : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Alamat Tinggal Lengkap <span className="text-[#C62828]">*</span>
              </label>
              <textarea
                id="address"
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Terusan Cibaduyut No. 12, Kel. Cangkuang Kulon, Kec. Dayeuhkolot, Kab. Bandung"
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Data Keanggotaan & Sepak Bola */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] border-b border-[#e2e8f0] pb-2">
            2. Posisi Lapangan & Status Keanggotaan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="playingPosition"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Posisi Bermain <span className="text-[#C62828]">*</span>
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
                Status Pemain <span className="text-[#C62828]">*</span>
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

        {/* Section 3: Orang Tua / Wali */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] border-b border-[#e2e8f0] pb-2">
            3. Kontak Orang Tua / Wali
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {error && (
          <div
            role="alert"
            className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#C62828] text-xs flex items-start gap-2.5"
          >
            <svg
              className="w-4 h-4 text-[#C62828] shrink-0 mt-0.5"
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
            to="/players"
            className="px-4 py-2 text-xs font-medium text-[#334155] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-[#0f172a] bg-[#FBC02D] hover:bg-[#E5A800] rounded-lg shadow-sm transition border border-[#FDE047] disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FBC02D]"
          >
            {isSubmitting ? 'Menyimpan Data...' : 'Simpan Data Pemain'}
          </button>
        </div>
      </form>
    </div>
  )
}
