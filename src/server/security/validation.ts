// Sanitasi string teks kontrol tersembunyi
export function sanitizeText(input: string): string {
  if (!input) return ''
  let result = ''
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i)
    // Allow tab (9), newline (10), carriage return (13) and chars >= 32 except DEL (127)
    if (
      (code >= 32 && code !== 127) ||
      code === 9 ||
      code === 10 ||
      code === 13
    ) {
      result += input[i]
    }
  }
  return result.trim()
}

// Validasi format UUID v4
export function validateUUID(id: unknown, fieldName = 'ID'): string {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error(`${fieldName} wajib disertakan`)
  }
  const cleanId = id.trim()
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(cleanId)) {
    throw new Error(`Format ${fieldName} tidak valid`)
  }
  return cleanId
}

// Validasi nomor telepon Indonesia/internasional
export function validatePhoneNumber(
  phone: unknown,
  fieldName = 'Nomor telepon',
  isRequired = true,
): string | undefined {
  if (phone === undefined || phone === null || phone === '') {
    if (isRequired) {
      throw new Error(`${fieldName} wajib diisi`)
    }
    return undefined
  }

  if (typeof phone !== 'string') {
    throw new Error(`${fieldName} harus berupa teks`)
  }

  const cleanPhone = sanitizeText(phone).replace(/[\s-]/g, '')
  if (cleanPhone === '') {
    if (isRequired) {
      throw new Error(`${fieldName} wajib diisi`)
    }
    return undefined
  }

  // Format telepon yang diperbolehkan: diawali +62, 62, atau 08/0, panjang digit 9 - 16
  const phoneRegex = /^(\+62|62|0)[0-9]{8,15}$/
  if (!phoneRegex.test(cleanPhone)) {
    throw new Error(
      `${fieldName} tidak valid. Gunakan format standar (contoh: 08123456789 atau +628123456789)`,
    )
  }

  if (cleanPhone.length > 30) {
    throw new Error(`${fieldName} maksimal 30 karakter`)
  }

  return cleanPhone
}

// Validasi tanggal YYYY-MM-DD
export function validateDateString(
  dateStr: unknown,
  fieldName = 'Tanggal',
  options?: { minYear?: number; maxYear?: number; notFuture?: boolean },
): string {
  if (typeof dateStr !== 'string' || !dateStr.trim()) {
    throw new Error(`${fieldName} wajib diisi`)
  }

  const cleanDate = dateStr.trim()
  // Format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(cleanDate)) {
    throw new Error(`Format ${fieldName} harus berupa YYYY-MM-DD`)
  }

  const parsed = new Date(`${cleanDate}T00:00:00.000Z`)
  if (isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} bukan tanggal kalender yang valid`)
  }

  const now = new Date()
  if (options?.notFuture && parsed > now) {
    throw new Error(`${fieldName} tidak boleh berada di masa depan`)
  }

  const year = parsed.getUTCFullYear()
  if (options?.minYear && year < options.minYear) {
    throw new Error(`Tahun pada ${fieldName} minimal ${options.minYear}`)
  }

  if (options?.maxYear && year > options.maxYear) {
    throw new Error(`Tahun pada ${fieldName} maksimal ${options.maxYear}`)
  }

  return cleanDate
}

// Posisi bermain resmi yang diperbolehkan
export const ALLOWED_PLAYING_POSITIONS = [
  'Keeper',
  'Bek',
  'Gelandang',
  'Penyerang',
] as const

export type DocStatus = 'ada' | 'belum_ada'

export interface ValidatedPlayerInput {
  fullName: string
  placeOfBirth: string
  dateOfBirth: string
  address: string
  playingPosition: string
  parentName?: string
  parentPhone?: string
  joinDate?: string
  status: 'active' | 'inactive'
  photoBase64?: string
  administration?: {
    registrationForm: DocStatus
    familyCard: DocStatus
    birthCertificate: DocStatus
    pasPhoto: DocStatus
    notes?: string
  }
}

export function validatePlayerPayload(raw: unknown): ValidatedPlayerInput {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Payload data pemain tidak valid')
  }

  const d = raw as Record<string, unknown>

  // 1. Nama Lengkap
  if (!d.fullName || typeof d.fullName !== 'string') {
    throw new Error('Nama lengkap wajib diisi')
  }
  const fullName = sanitizeText(d.fullName)
  if (fullName.length < 2 || fullName.length > 150) {
    throw new Error(
      'Nama lengkap harus memiliki panjang antara 2 hingga 150 karakter',
    )
  }

  // 2. Tempat Lahir
  if (!d.placeOfBirth || typeof d.placeOfBirth !== 'string') {
    throw new Error('Tempat lahir wajib diisi')
  }
  const placeOfBirth = sanitizeText(d.placeOfBirth)
  if (placeOfBirth.length < 2 || placeOfBirth.length > 100) {
    throw new Error(
      'Tempat lahir harus memiliki panjang antara 2 hingga 100 karakter',
    )
  }

  // 3. Tanggal Lahir (wajib masa lalu, umur rasional 4 - 35 tahun untuk siswa SSB)
  const currentYear = new Date().getFullYear()
  const dateOfBirth = validateDateString(d.dateOfBirth, 'Tanggal lahir', {
    notFuture: true,
    minYear: currentYear - 35,
    maxYear: currentYear - 4,
  })

  // 4. Alamat
  if (!d.address || typeof d.address !== 'string') {
    throw new Error('Alamat wajib diisi')
  }
  const address = sanitizeText(d.address)
  if (address.length < 3 || address.length > 1000) {
    throw new Error(
      'Alamat harus memiliki panjang antara 3 hingga 1000 karakter',
    )
  }

  // 5. Posisi Bermain
  if (!d.playingPosition || typeof d.playingPosition !== 'string') {
    throw new Error('Posisi bermain wajib dipilih')
  }
  const playingPosition = sanitizeText(d.playingPosition)
  const isPositionValid = ALLOWED_PLAYING_POSITIONS.some(
    (pos) => pos.toLowerCase() === playingPosition.toLowerCase(),
  )
  if (!isPositionValid && playingPosition.length > 50) {
    throw new Error('Posisi bermain tidak valid atau melebihi 50 karakter')
  }

  // 6. Nama Orang Tua (opsional)
  let parentName: string | undefined
  if (d.parentName && typeof d.parentName === 'string') {
    const cleanParentName = sanitizeText(d.parentName)
    if (cleanParentName.length > 150) {
      throw new Error('Nama orang tua maksimal 150 karakter')
    }
    if (cleanParentName.length > 0) {
      parentName = cleanParentName
    }
  }

  // 7. Nomor Telepon Orang Tua (opsional)
  const parentPhone = validatePhoneNumber(
    d.parentPhone,
    'Nomor WhatsApp / Telepon Orang Tua',
    false,
  )

  // 8. Tanggal Bergabung (opsional)
  let joinDate: string | undefined
  if (
    d.joinDate &&
    typeof d.joinDate === 'string' &&
    d.joinDate.trim() !== ''
  ) {
    joinDate = validateDateString(d.joinDate, 'Tanggal bergabung', {
      minYear: 2000,
      maxYear: currentYear + 1,
    })
  }

  // 9. Status
  const status: 'active' | 'inactive' =
    d.status === 'inactive' ? 'inactive' : 'active'

  // 10. Foto Profil Base64 (opsional)
  let photoBase64: string | undefined
  if (
    d.photoBase64 &&
    typeof d.photoBase64 === 'string' &&
    d.photoBase64.trim() !== ''
  ) {
    const rawPhoto = d.photoBase64.trim()
    // Cegah javascript: URI atau payload XSS dalam atribut base64
    if (!rawPhoto.startsWith('data:image/')) {
      throw new Error(
        'Format data gambar tidak valid (harus diawali data:image/)',
      )
    }
    photoBase64 = rawPhoto
  }

  // 11. Berkas Administrasi (opsional saat pendaftaran)
  let administration: ValidatedPlayerInput['administration']
  if (d.administration && typeof d.administration === 'object') {
    const admin = d.administration as Record<string, unknown>
    const parseDoc = (val: unknown): DocStatus =>
      val === 'ada' ? 'ada' : 'belum_ada'

    const registrationForm = parseDoc(admin.registrationForm)
    const familyCard = parseDoc(admin.familyCard)
    const birthCertificate = parseDoc(admin.birthCertificate)
    const pasPhoto = parseDoc(admin.pasPhoto)
    const notes =
      typeof admin.notes === 'string'
        ? sanitizeText(admin.notes).slice(0, 500)
        : undefined

    administration = {
      registrationForm,
      familyCard,
      birthCertificate,
      pasPhoto,
      notes: notes && notes.length > 0 ? notes : undefined,
    }
  }

  return {
    fullName,
    placeOfBirth,
    dateOfBirth,
    address,
    playingPosition,
    parentName,
    parentPhone,
    joinDate,
    status,
    photoBase64,
    administration,
  }
}

export interface ValidatedCoachInput {
  fullName: string
  phone: string
  address: string
  status: 'active' | 'inactive'
  photoBase64?: string
}

export function validateCoachPayload(raw: unknown): ValidatedCoachInput {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Payload data pelatih tidak valid')
  }

  const d = raw as Record<string, unknown>

  // 1. Nama Lengkap
  if (!d.fullName || typeof d.fullName !== 'string') {
    throw new Error('Nama lengkap pelatih wajib diisi')
  }
  const fullName = sanitizeText(d.fullName)
  if (fullName.length < 2 || fullName.length > 150) {
    throw new Error(
      'Nama lengkap harus memiliki panjang antara 2 hingga 150 karakter',
    )
  }

  // 2. Nomor Telepon (Wajib)
  const phone = validatePhoneNumber(d.phone, 'Nomor telepon pelatih', true)
  if (!phone) {
    throw new Error('Nomor telepon pelatih wajib diisi')
  }

  // 3. Alamat
  if (!d.address || typeof d.address !== 'string') {
    throw new Error('Alamat pelatih wajib diisi')
  }
  const address = sanitizeText(d.address)
  if (address.length < 3 || address.length > 1000) {
    throw new Error(
      'Alamat harus memiliki panjang antara 3 hingga 1000 karakter',
    )
  }

  // 4. Status
  const status: 'active' | 'inactive' =
    d.status === 'inactive' ? 'inactive' : 'active'

  // 5. Foto Profil Base64 (opsional)
  let photoBase64: string | undefined
  if (
    d.photoBase64 &&
    typeof d.photoBase64 === 'string' &&
    d.photoBase64.trim() !== ''
  ) {
    const rawPhoto = d.photoBase64.trim()
    if (!rawPhoto.startsWith('data:image/')) {
      throw new Error(
        'Format data gambar tidak valid (harus diawali data:image/)',
      )
    }
    photoBase64 = rawPhoto
  }

  return {
    fullName,
    phone,
    address,
    status,
    photoBase64,
  }
}

export interface ValidatedLoginInput {
  username: string
  password: string
}

export function validateLoginPayload(raw: unknown): ValidatedLoginInput {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Data login tidak valid')
  }

  const d = raw as Record<string, unknown>

  if (!d.username || typeof d.username !== 'string') {
    throw new Error('Username wajib diisi')
  }
  const username = sanitizeText(d.username)
  if (username.length < 3 || username.length > 50) {
    throw new Error('Panjang username antara 3 hingga 50 karakter')
  }

  if (!d.password || typeof d.password !== 'string') {
    throw new Error('Kata sandi wajib diisi')
  }
  if (d.password.length < 4 || d.password.length > 100) {
    throw new Error('Panjang kata sandi antara 5 hingga 100 karakter')
  }

  return {
    username,
    password: d.password,
  }
}
