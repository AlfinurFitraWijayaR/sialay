import { useRef, useState } from 'react'
import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { getAuthSessionFn } from '../../../server/auth/actions'
import {
  deleteCoachPhotoFn,
  getCoachDetailFn,
  updateCoachFn,
  uploadCoachPhotoFn,
} from '../../../server/coaches/actions'

export const Route = createFileRoute('/coaches/$coachId/edit')({
  beforeLoad: async () => {
    const admin = await getAuthSessionFn()
    if (!admin) {
      throw redirect({ to: '/login' })
    }
  },
  loader: async ({ params }) => {
    const coach = await getCoachDetailFn({ data: { id: params.coachId } })
    if (!coach) {
      throw redirect({ to: '/coaches' })
    }
    return { coach }
  },
  component: EditCoachPage,
})

function EditCoachPage() {
  const { coach } = Route.useLoaderData()
  const router = useRouter()

  const [fullName, setFullName] = useState(coach.fullName)
  const [phone, setPhone] = useState(coach.phone)
  const [address, setAddress] = useState(coach.address)
  const [status, setStatus] = useState<'active' | 'inactive'>(
    coach.status === 'inactive' ? 'inactive' : 'active',
  )

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Photo management state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false)
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

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
          await uploadCoachPhotoFn({
            data: {
              coachId: coach.id,
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
      await deleteCoachPhotoFn({
        data: { coachId: coach.id },
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
      await updateCoachFn({
        data: {
          id: coach.id,
          fullName,
          phone,
          address,
          status,
        },
      })

      await router.invalidate()
      window.location.href = `/coaches/${coach.id}`
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memperbarui data pelatih.',
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
            to="/coaches/$coachId"
            params={{ coachId: coach.id }}
            className="text-xs font-semibold text-[#0f172a] hover:text-[#972828] hover:underline"
          >
            ← Kembali ke Detail Pelatih
          </Link>
        </div>
        <h1 className="text-xl font-bold text-[#0f172a] tracking-tight">
          Edit Biodata Pelatih
        </h1>
        <p className="text-xs text-[#475569] mt-0.5">
          Perbarui data pelatih{' '}
          <strong className="text-[#0f172a]">{coach.fullName}</strong>.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-5">
          {/* Section: Foto Profil Pelatih */}
          <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
            <div className="text-xs font-semibold text-[#334155] mb-2">
              Foto Profil Pelatih
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#cbd5e1] bg-white flex items-center justify-center shrink-0 shadow-2xs">
                {coach.photoDataUrl ? (
                  <img
                    src={coach.photoDataUrl}
                    alt={coach.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#972828] text-white flex items-center justify-center font-bold text-lg">
                    {coach.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="editCoachPhotoInput"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploadingPhoto}
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium text-[#0f172a] bg-white hover:bg-gray-50 border border-[#cbd5e1] rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {isUploadingPhoto
                      ? 'Mengunggah...'
                      : coach.photoDataUrl
                        ? 'Ganti Foto'
                        : 'Unggah Foto'}
                  </button>

                  {coach.photoDataUrl && (
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => setShowDeletePhotoModal(true)}
                      className="px-3 py-1.5 text-xs font-medium text-[#972828] hover:bg-[#FEF2F2] border border-[#FECACA] rounded-lg transition disabled:opacity-50 cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#64748b]">
                  Format JPEG, PNG, atau WebP. Maksimal 2MB.
                </p>
                {photoError && (
                  <p className="text-[11px] text-[#972828] font-medium">
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
                Nama Lengkap Pelatih <span className="text-[#972828]">*</span>
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
                htmlFor="phone"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Nomor Telepon / WhatsApp{' '}
                <span className="text-[#972828]">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Status Keaktifan <span className="text-[#972828]">*</span>
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
                Alamat Tinggal <span className="text-[#972828]">*</span>
              </label>
              <textarea
                id="address"
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-lg text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#FBC02D] focus:border-[#FBC02D]"
              />
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
            to="/coaches/$coachId"
            params={{ coachId: coach.id }}
            className="px-4 py-2 text-xs font-medium text-[#334155] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition cursor-pointer"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-[#0f172a] bg-[#FBC02D] hover:bg-[#E5A800] rounded-lg shadow-sm transition border border-[#FDE047] disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FBC02D]"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
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
                <p className="text-xs text-[#64748b] mt-1">
                  Foto profil pelatih ini akan dihapus. Anda dapat mengunggah
                  foto baru kapan saja.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingPhoto}
                onClick={() => setShowDeletePhotoModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#334155] bg-white hover:bg-gray-50 rounded-lg border border-[#cbd5e1] transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingPhoto}
                onClick={handleDeletePhoto}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#972828] hover:bg-[#B71C1C] rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {isDeletingPhoto ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
