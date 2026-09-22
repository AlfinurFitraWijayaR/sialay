import { useRef, useState } from 'react'
import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { formatIndonesianDate } from '../../../lib/player-utils'
import { getAuthSessionFn } from '../../../server/auth/actions'
import {
  deleteCoachFn,
  deleteCoachPhotoFn,
  getCoachDetailFn,
  uploadCoachPhotoFn,
} from '../../../server/coaches/actions'

export const Route = createFileRoute('/coaches/$coachId/')({
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
  component: CoachDetailPage,
})

function CoachDetailPage() {
  const { coach } = Route.useLoaderData()
  const router = useRouter()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Photo management state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false)
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoError(null)

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Ukuran berkas lebih dari 2MB. Harap pilih berkas lain.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validMimes.includes(file.type)) {
      setPhotoError(
        'Format berkas tidak didukung. Harap gunakan format JPEG, PNG, atau WebP.',
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
              : 'Gagal mengunggah foto profil.',
          )
        } finally {
          setIsUploadingPhoto(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      }
      reader.onerror = () => {
        setPhotoError('Gagal membaca berkas foto.')
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
      await deleteCoachPhotoFn({
        data: { coachId: coach.id },
      })
      setShowDeletePhotoModal(false)
      await router.invalidate()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus foto profil.')
    } finally {
      setIsDeletingPhoto(false)
    }
  }

  const handleDeleteCoach = async () => {
    setIsDeleting(true)
    try {
      await deleteCoachFn({ data: { id: coach.id } })
      window.location.href = '/coaches'
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus pelatih')
      setIsDeleting(false)
    }
  }

  // Format phone number for WhatsApp link
  const cleanPhone = coach.phone.replace(/[^0-9]/g, '')
  const waPhone = cleanPhone.startsWith('0')
    ? `62${cleanPhone.slice(1)}`
    : cleanPhone

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          {/* Avatar / Photo Frame */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-[#cbd5e1] bg-white flex items-center justify-center shadow-xs">
              {coach.photoDataUrl ? (
                <img
                  src={coach.photoDataUrl}
                  alt={coach.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#972828] text-white flex items-center justify-center font-bold text-2xl tracking-wider">
                  {coach.fullName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Quick Change Badge on Hover */}
            <button
              type="button"
              disabled={isUploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-medium transition cursor-pointer"
              title="Klik untuk mengubah foto"
            >
              <svg
                className="w-5 h-5 mb-0.5"
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
              <span>Ubah Foto</span>
            </button>
          </div>

          <div className="space-y-1">
            <div>
              <Link
                to="/coaches"
                className="text-xs font-semibold text-[#0f172a] hover:text-[#972828] hover:underline"
              >
                ← Kembali ke Daftar Pelatih
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
                {coach.fullName}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold border ${
                  coach.status === 'active'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    coach.status === 'active' ? 'bg-emerald-600' : 'bg-gray-500'
                  }`}
                />
                {coach.status === 'active' ? 'Pelatih Aktif' : 'Non-Aktif'}
              </span>
            </div>
            <p className="text-xs text-[#64748b]">
              ID Pelatih:{' '}
              <code className="font-mono text-[#334155]">{coach.id}</code>
            </p>

            {/* Photo Action Links */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isUploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-semibold text-[#0f172a] hover:text-[#972828] hover:underline cursor-pointer disabled:opacity-50"
              >
                {isUploadingPhoto
                  ? 'Mengunggah...'
                  : coach.photoDataUrl
                    ? 'Ganti Foto'
                    : '+ Unggah Foto Profil'}
              </button>
              {coach.photoDataUrl && (
                <>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    disabled={isDeletingPhoto}
                    onClick={() => setShowDeletePhotoModal(true)}
                    className="text-[11px] font-medium text-[#972828] hover:underline cursor-pointer"
                  >
                    Hapus Foto
                  </button>
                </>
              )}
            </div>

            {photoError && (
              <div
                role="alert"
                className="p-2 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#972828] text-[11px] mt-1"
              >
                {photoError}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to="/coaches/$coachId/edit"
            params={{ coachId: coach.id }}
            className="px-4 py-2 text-xs font-semibold text-[#0f172a] bg-[#FBC02D] hover:bg-[#E5A800] rounded-lg shadow-sm transition border border-[#FDE047] focus:outline-none focus:ring-2 focus:ring-[#FBC02D]"
          >
            Edit Biodata
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-xs font-semibold text-[#972828] bg-white hover:bg-[#FEF2F2] rounded-lg border border-[#FECACA] transition cursor-pointer"
          >
            Hapus Pelatih
          </button>
        </div>
      </div>

      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Kontak Resmi */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] border-b border-[#e2e8f0] pb-2">
            Kontak Resmi Pelatih
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Nomor Telepon / WhatsApp
              </div>
              <div className="text-sm font-semibold text-[#0f172a] mt-0.5 tabular-nums flex items-center gap-3">
                <span>{coach.phone}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${coach.phone}`}
                    className="px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                  >
                    Telepon
                  </a>
                  <a
                    href={`https://wa.me/${waPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Alamat Tinggal */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] border-b border-[#e2e8f0] pb-2">
            Alamat Tinggal
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Alamat Domisili
              </div>
              <div className="text-sm font-medium text-[#0f172a] mt-0.5 leading-relaxed">
                {coach.address}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Riwayat Sistem */}
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6 shadow-sm space-y-4 md:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] border-b border-[#e2e8f0] pb-2">
            Administrasi & Catatan Sistem
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Tanggal Registrasi Akun
              </div>
              <div className="text-sm font-semibold text-[#0f172a] mt-0.5">
                {formatIndonesianDate(coach.createdAt)}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-[#64748b]">
                Pembaruan Terakhir
              </div>
              <div className="text-sm font-semibold text-[#0f172a] mt-0.5">
                {formatIndonesianDate(coach.updatedAt)}
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
                  Foto profil pelatih ini akan dihapus secara permanen dari
                  penyimpanan.
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

      {/* Delete Coach Confirmation Modal */}
      {showDeleteModal && (
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
                    {coach.fullName}
                  </strong>
                  ? Seluruh data dan berkas foto profil terkait akan dihapus
                  secara permanen. Tindakan ini tidak dapat dibatalkan.
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
                onClick={handleDeleteCoach}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#972828] hover:bg-[#B71C1C] rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
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
