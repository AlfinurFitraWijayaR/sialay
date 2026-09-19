import { useRef, useState } from 'react'
import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { getAuthSessionFn } from '../../server/auth/actions'
import { createCoachFn } from '../../server/coaches/actions'

export const Route = createFileRoute('/coaches/create')({
  beforeLoad: async () => {
    const admin = await getAuthSessionFn()
    if (!admin) {
      throw redirect({ to: '/login' })
    }
  },
  component: CreateCoachPage,
})

function CreateCoachPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')

  // Photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoError(null)

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError(
        `Ukuran berkas (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimum 2MB.`,
      )
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validMimes.includes(file.type)) {
      setPhotoError(
        'Format berkas tidak didukung. Harap pilih gambar JPEG, PNG, atau WebP.',
      )
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setPhotoPreview(result)
      setPhotoBase64(result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPhotoPreview(null)
    setPhotoBase64(null)
    setPhotoError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Nama lengkap pelatih wajib diisi.')
      return
    }
    if (!phone.trim()) {
      setError('Nomor telepon/WhatsApp pelatih wajib diisi.')
      return
    }
    if (!address.trim()) {
      setError('Alamat pelatih wajib diisi.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createCoachFn({
        data: {
          fullName,
          phone,
          address,
          status,
          photoBase64: photoBase64 || undefined,
        },
      })

      await router.invalidate()
      window.location.href = `/coaches/${res.id}`
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menyimpan data pelatih.',
      )
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm">
        <div className="mb-2">
          <Link
            to="/coaches"
            className="text-xs font-semibold text-[#0f172a] hover:text-[#C62828] hover:underline"
          >
            ← Kembali ke Daftar Pelatih
          </Link>
        </div>
        <h1 className="text-xl font-bold text-[#0f172a] tracking-tight">
          Tambah Pelatih Baru
        </h1>
        <p className="text-xs text-[#475569] mt-0.5">
          Lengkapi formulir biodata pelatih SSB Mundinglaya berikut secara akurat.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-5">
          {/* Optional Profile Photo Selector */}
          <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
            <div className="text-xs font-semibold text-[#334155] mb-2">
              Foto Profil Pelatih{' '}
              <span className="text-[#64748b] font-normal">(Opsional)</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#cbd5e1] bg-white flex items-center justify-center shrink-0 shadow-2xs">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Pratinjau Foto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-gray-400">
                    <svg
                      className="w-8 h-8 mx-auto"
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
                    <span className="text-[9px] block mt-0.5">Tanpa Foto</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="coachPhotoSelect"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium text-[#0f172a] bg-white hover:bg-gray-50 border border-[#cbd5e1] rounded-lg transition cursor-pointer"
                  >
                    {photoPreview ? 'Ganti Foto' : 'Pilih Berkas Foto'}
                  </button>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-1.5 text-xs font-medium text-[#C62828] hover:bg-[#FEF2F2] border border-[#FECACA] rounded-lg transition cursor-pointer"
                    >
                      Hapus Pilihan
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#64748b]">
                  Format JPEG, PNG, atau WebP. Maksimal 2MB. Foto akan otomatis dikompresi ke format WebP di server.
                </p>
                {photoError && (
                  <p className="text-[11px] text-[#C62828] font-medium">
                    {photoError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Nama Lengkap Pelatih <span className="text-[#C62828]">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Coach Budi Santoso, S.Pd"
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Nomor Telepon / WhatsApp <span className="text-[#C62828]">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Status Keaktifan <span className="text-[#C62828]">*</span>
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

            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Alamat Tinggal <span className="text-[#C62828]">*</span>
              </label>
              <textarea
                id="address"
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Sukajadi No. 45, RT 02/RW 04, Majalengka"
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
            to="/coaches"
            className="px-4 py-2 text-xs font-medium text-[#334155] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-[#0f172a] bg-[#FBC02D] hover:bg-[#E5A800] rounded-lg shadow-sm transition border border-[#FDE047] disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FBC02D]"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Data Pelatih'}
          </button>
        </div>
      </form>
    </div>
  )
}
