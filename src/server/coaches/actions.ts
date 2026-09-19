import crypto from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import { count, desc, eq } from 'drizzle-orm'
import { getCurrentSession } from '../auth/session'
import { db } from '../db'
import type { Coach } from '../db/schema'
import { coaches } from '../db/schema'
import { logServerError, sanitizeErrorMessage } from '../security/error-handler'
import type { ValidatedCoachInput } from '../security/validation'
import { validateCoachPayload, validateUUID } from '../security/validation'
import {
  deleteCoachPhoto,
  getCoachPhotoDataUrl,
  saveCoachPhoto,
} from '../storage/photo-storage'

export interface CoachListItem extends Coach {
  photoDataUrl?: string | null
}

export interface PaginatedCoachesResult {
  coaches: CoachListItem[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// Get Coaches List
export const getCoachesFn = createServerFn({ method: 'GET' })
  .validator((opts?: { page?: number; pageSize?: number }) => {
    const page = Math.max(1, Math.floor(Number(opts?.page || 1)))
    const pageSize = Math.min(
      50,
      Math.max(5, Math.floor(Number(opts?.pageSize || 15))),
    )
    return { page, pageSize }
  })
  .handler(async ({ data }): Promise<PaginatedCoachesResult> => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      const { page, pageSize } = data
      const offset = (page - 1) * pageSize

      const [totalRows, rows] = await Promise.all([
        db.select({ val: count() }).from(coaches),
        db
          .select()
          .from(coaches)
          .orderBy(desc(coaches.createdAt))
          .limit(pageSize)
          .offset(offset),
      ])

      const totalCount = totalRows[0]?.val ?? 0
      const totalPages = Math.ceil(totalCount / pageSize) || 1

      const listWithPhotos: CoachListItem[] = await Promise.all(
        rows.map(async (c) => ({
          ...c,
          photoDataUrl: c.profilePhotoKey
            ? await getCoachPhotoDataUrl(c.profilePhotoKey)
            : null,
        })),
      )

      return {
        coaches: listWithPhotos,
        totalCount,
        page,
        pageSize,
        totalPages,
      }
    } catch (err: unknown) {
      logServerError('getCoachesFn', err)
      throw new Error(sanitizeErrorMessage(err, 'Gagal memuat daftar pelatih.'))
    }
  })

// Get Single Coach Detail by ID
export const getCoachDetailFn = createServerFn({ method: 'GET' })
  .validator((opts: { id: string }) => {
    return { id: validateUUID(opts.id, 'ID Pelatih') }
  })
  .handler(async ({ data }): Promise<CoachListItem | null> => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      const results = await db
        .select()
        .from(coaches)
        .where(eq(coaches.id, data.id))
        .limit(1)

      if (results.length === 0) {
        return null
      }

      const coach = results[0]
      const photoDataUrl = coach.profilePhotoKey
        ? await getCoachPhotoDataUrl(coach.profilePhotoKey)
        : null

      return {
        ...coach,
        photoDataUrl,
      }
    } catch (err: unknown) {
      logServerError('getCoachDetailFn', err)
      throw new Error(sanitizeErrorMessage(err, 'Gagal memuat detail pelatih.'))
    }
  })

// Create Coach
export const createCoachFn = createServerFn({ method: 'POST' })
  .validator((data: unknown): ValidatedCoachInput => {
    return validateCoachPayload(data)
  })
  .handler(async ({ data }) => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      const newId = crypto.randomUUID()
      let savedPhotoKey: string | null = null

      if (data.photoBase64) {
        const base64Data = data.photoBase64.replace(/^data:[^;]+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        const { key } = await saveCoachPhoto(buffer)
        savedPhotoKey = key
      }

      await db.insert(coaches).values({
        id: newId,
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        status: data.status,
        profilePhotoKey: savedPhotoKey,
      })

      return { success: true, id: newId }
    } catch (err: unknown) {
      logServerError('createCoachFn', err)
      throw new Error(
        sanitizeErrorMessage(err, 'Gagal menambahkan pelatih baru.'),
      )
    }
  })

export interface UpdateCoachInput extends ValidatedCoachInput {
  id: string
}

// Update Coach
export const updateCoachFn = createServerFn({ method: 'POST' })
  .validator((data: unknown): UpdateCoachInput => {
    if (!data || typeof data !== 'object') {
      throw new Error('Data tidak valid')
    }
    const d = data as Record<string, unknown>
    const id = validateUUID(d.id, 'ID Pelatih')
    const validated = validateCoachPayload(data)
    return { ...validated, id }
  })
  .handler(async ({ data }) => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      await db
        .update(coaches)
        .set({
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          status: data.status,
          updatedAt: new Date(),
        })
        .where(eq(coaches.id, data.id))

      return { success: true }
    } catch (err: unknown) {
      logServerError('updateCoachFn', err)
      throw new Error(
        sanitizeErrorMessage(err, 'Gagal memperbarui data pelatih.'),
      )
    }
  })

// Update Status Pelatih
export const updateCoachStatusFn = createServerFn({ method: 'POST' })
  .validator((opts: { id: string; status: 'active' | 'inactive' }) => {
    const id = validateUUID(opts.id, 'ID Pelatih')
    const status: 'active' | 'inactive' =
      opts.status === 'inactive' ? 'inactive' : 'active'
    return { id, status }
  })
  .handler(async ({ data }) => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      await db
        .update(coaches)
        .set({
          status: data.status,
          updatedAt: new Date(),
        })
        .where(eq(coaches.id, data.id))

      return { success: true }
    } catch (err: unknown) {
      logServerError('updateCoachStatusFn', err)
      throw new Error(
        sanitizeErrorMessage(err, 'Gagal memperbarui status pelatih.'),
      )
    }
  })

// Delete Coach
export const deleteCoachFn = createServerFn({ method: 'POST' })
  .validator((opts: { id: string }) => {
    return { id: validateUUID(opts.id, 'ID Pelatih') }
  })
  .handler(async ({ data }) => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      const rows = await db
        .select({ profilePhotoKey: coaches.profilePhotoKey })
        .from(coaches)
        .where(eq(coaches.id, data.id))
        .limit(1)

      if (rows.length > 0 && rows[0].profilePhotoKey) {
        await deleteCoachPhoto(rows[0].profilePhotoKey)
      }

      await db.delete(coaches).where(eq(coaches.id, data.id))
      return { success: true }
    } catch (err: unknown) {
      logServerError('deleteCoachFn', err)
      throw new Error(
        sanitizeErrorMessage(err, 'Gagal menghapus data pelatih.'),
      )
    }
  })

// Upload atau Replace PP Pelatih
export const uploadCoachPhotoFn = createServerFn({ method: 'POST' })
  .validator(
    (opts: { coachId: string; fileBase64: string; fileName?: string }) => {
      const coachId = validateUUID(opts.coachId, 'ID Pelatih')
      if (!opts.fileBase64 || typeof opts.fileBase64 !== 'string') {
        throw new Error('Data foto wajib disertakan.')
      }
      if (!opts.fileBase64.startsWith('data:image/')) {
        throw new Error('Format berkas gambar tidak valid.')
      }
      return { coachId, fileBase64: opts.fileBase64 }
    },
  )
  .handler(async ({ data }) => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      const rows = await db
        .select()
        .from(coaches)
        .where(eq(coaches.id, data.coachId))
        .limit(1)

      if (rows.length === 0) {
        throw new Error('Data pelatih tidak ditemukan.')
      }

      const existingCoach = rows[0]
      const base64Data = data.fileBase64.replace(/^data:[^;]+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      // Validasi ukuran berkas, magic bytes, dan kompresi WebP
      const { key } = await saveCoachPhoto(buffer)

      // Hapus berkas lama jika ada
      if (existingCoach.profilePhotoKey) {
        await deleteCoachPhoto(existingCoach.profilePhotoKey)
      }

      await db
        .update(coaches)
        .set({
          profilePhotoKey: key,
          updatedAt: new Date(),
        })
        .where(eq(coaches.id, data.coachId))

      const photoDataUrl = await getCoachPhotoDataUrl(key)
      return { success: true, key, photoDataUrl }
    } catch (err: unknown) {
      logServerError('uploadCoachPhotoFn', err)
      throw new Error(
        sanitizeErrorMessage(err, 'Gagal mengunggah foto profil pelatih.'),
      )
    }
  })

// Remove Coach Profile Photo
export const deleteCoachPhotoFn = createServerFn({ method: 'POST' })
  .validator((opts: { coachId: string }) => {
    return { coachId: validateUUID(opts.coachId, 'ID Pelatih') }
  })
  .handler(async ({ data }) => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      const rows = await db
        .select()
        .from(coaches)
        .where(eq(coaches.id, data.coachId))
        .limit(1)

      if (rows.length === 0) {
        throw new Error('Data pelatih tidak ditemukan.')
      }

      const existingCoach = rows[0]
      if (existingCoach.profilePhotoKey) {
        await deleteCoachPhoto(existingCoach.profilePhotoKey)
      }

      await db
        .update(coaches)
        .set({
          profilePhotoKey: null,
          updatedAt: new Date(),
        })
        .where(eq(coaches.id, data.coachId))

      return { success: true }
    } catch (err: unknown) {
      logServerError('deleteCoachPhotoFn', err)
      throw new Error(
        sanitizeErrorMessage(err, 'Gagal menghapus foto profil pelatih.'),
      )
    }
  })

// Get Protected Coach Profile Photo
export const getCoachPhotoFn = createServerFn({ method: 'GET' })
  .validator((opts: { coachId: string }) => {
    return { coachId: validateUUID(opts.coachId, 'ID Pelatih') }
  })
  .handler(async ({ data }) => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      const rows = await db
        .select({ profilePhotoKey: coaches.profilePhotoKey })
        .from(coaches)
        .where(eq(coaches.id, data.coachId))
        .limit(1)

      if (rows.length === 0 || !rows[0].profilePhotoKey) {
        return { photoDataUrl: null }
      }

      const photoDataUrl = await getCoachPhotoDataUrl(rows[0].profilePhotoKey)
      return { photoDataUrl }
    } catch (err: unknown) {
      logServerError('getCoachPhotoFn', err)
      return { photoDataUrl: null }
    }
  })
