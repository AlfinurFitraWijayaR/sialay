import React, { useState } from 'react'
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

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const liveKU = calculateKU(dateOfBirth)
  const liveAge = calculateAge(dateOfBirth)

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
    if (!parentName.trim()) {
      setError('Nama orang tua / wali wajib diisi.')
      return
    }
    if (!parentPhone.trim()) {
      setError('Nomor telepon / WhatsApp orang tua wajib diisi.')
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
          parentName,
          parentPhone,
          joinDate: joinDate || undefined,
          status,
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
              className="text-xs font-semibold text-[#0F2C59] hover:underline"
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

      {error && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5"
        >
          <svg
            className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
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

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identitas Pribadi */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F2C59] border-b border-[#e2e8f0] pb-2">
            1. Biodata Pribadi Pemain
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Nama Lengkap Pemain <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Muhammad Rizky Pratama"
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-[#0F2C59] focus:border-[#0F2C59]"
              />
            </div>

            <div>
              <label
                htmlFor="placeOfBirth"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Tempat Lahir <span className="text-red-500">*</span>
              </label>
              <input
                id="placeOfBirth"
                type="text"
                required
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
                placeholder="Contoh: Bandung"
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-[#0F2C59] focus:border-[#0F2C59]"
              />
            </div>

            <div>
              <label
                htmlFor="dateOfBirth"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Tanggal Lahir <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="dateOfBirth"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#0F2C59] focus:border-[#0F2C59]"
                />
                {dateOfBirth && (
                  <span className="inline-flex items-center px-2.5 py-1.5 rounded text-xs font-semibold bg-[#e8f5f1] text-[#143d32] border border-[#bce3d6] shrink-0 tabular-nums">
                    {liveKU} {liveAge !== null ? `(${liveAge} thn)` : ''}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                KU dihitung otomatis dari tahun lahir pemain.
              </p>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Alamat Tempat Tinggal <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Alamat lengkap domisili pemain saat ini"
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-[#0F2C59] focus:border-[#0F2C59]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Administrasi & Posisi */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F2C59] border-b border-[#e2e8f0] pb-2">
            2. Posisi Bermain & Administrasi Klub
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="playingPosition"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Posisi Bermain <span className="text-red-500">*</span>
              </label>
              <select
                id="playingPosition"
                value={playingPosition}
                onChange={(e) => setPlayingPosition(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#0F2C59] focus:border-[#0F2C59]"
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
                <span className="text-gray-400">(Opsional)</span>
              </label>
              <input
                id="joinDate"
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#0F2C59] focus:border-[#0F2C59]"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Status Keaktifan <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'active' | 'inactive')
                }
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#0F2C59] focus:border-[#0F2C59]"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Non-Aktif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Orang Tua / Wali */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F2C59] border-b border-[#e2e8f0] pb-2">
            3. Data Orang Tua / Wali
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="parentName"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Nama Orang Tua / Wali <span className="text-red-500">*</span>
              </label>
              <input
                id="parentName"
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-[#0F2C59] focus:border-[#0F2C59]"
              />
            </div>

            <div>
              <label
                htmlFor="parentPhone"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                No. Telepon / WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                id="parentPhone"
                type="tel"
                required
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-[#0F2C59] focus:border-[#0F2C59]"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/players"
            className="px-4 py-2.5 text-xs font-medium text-[#334155] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#0F2C59] hover:bg-[#1A365D] text-white text-xs font-semibold rounded-lg shadow-sm transition border border-[#0A1D3A] focus:outline-none focus:ring-2 focus:ring-[#0F2C59] disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-3.5 w-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan Data Pemain</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
