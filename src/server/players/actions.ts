import crypto from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import type { SQL } from 'drizzle-orm'
import { and, count, desc, eq, gte, ilike, lte } from 'drizzle-orm'
import { calculateAge, calculateKU } from '../../lib/player-utils'
import { getCurrentSession } from '../auth/session'
import { db } from '../db'
import type { Administration, Player } from '../db/schema'
import { administrations, players } from '../db/schema'
import { logServerError, sanitizeErrorMessage } from '../security/error-handler'
import type { ValidatedPlayerInput } from '../security/validation'
import {
  sanitizeText,
  validatePlayerPayload,
  validateUUID,
} from '../security/validation'
import {
  deletePlayerPhoto,
  getPhotoDataUrl,
  savePlayerPhoto,
} from '../storage/photo-storage'

export interface PlayerListItem extends Player {
  ku: string
  age: number | null
  photoDataUrl?: string | null
  administration?: Administration | null
}

export interface GetPlayersFilter {
  page?: number
  pageSize?: number
  search?: string
  status?: 'active' | 'inactive' | 'all'
  birthYear?: number
}

export interface PaginatedPlayersResult {
  players: PlayerListItem[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  availableBirthYears: number[]
}

// Get Players List
export const getPlayersFn = createServerFn({ method: 'GET' })
  .validator((opts?: GetPlayersFilter) => {
    const page = Math.max(1, Math.floor(Number(opts?.page || 1)))
    const pageSize = Math.min(
      50,
      Math.max(5, Math.floor(Number(opts?.pageSize || 15))),
    )
    const search =
      typeof opts?.search === 'string' && opts.search.trim() !== ''
        ? sanitizeText(opts.search).slice(0, 100)
        : undefined
    const status =
      opts?.status === 'active' || opts?.status === 'inactive'
        ? opts.status
        : undefined
    const birthYear =
      opts?.birthYear &&
      !isNaN(Number(opts.birthYear)) &&
      Number(opts.birthYear) > 1900
        ? Math.floor(Number(opts.birthYear))
        : undefined

    return { page, pageSize, search, status, birthYear }
  })
  .handler(async ({ data }): Promise<PaginatedPlayersResult> => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      const { page, pageSize, search, status, birthYear } = data
      const offset = (page - 1) * pageSize

      const conditions: SQL[] = []

      if (search) {
        conditions.push(ilike(players.fullName, `%${search}%`))
      }

      if (status) {
        conditions.push(eq(players.status, status))
      }

      if (birthYear) {
        conditions.push(gte(players.dateOfBirth, `${birthYear}-01-01`))
        conditions.push(lte(players.dateOfBirth, `${birthYear}-12-31`))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const [totalRows, rows, allDobRows] = await Promise.all([
        db.select({ val: count() }).from(players).where(whereClause),
        db.query.players.findMany({
          where: whereClause,
          with: {
            administration: true,
          },
          orderBy: [desc(players.createdAt)],
          limit: pageSize,
          offset: offset,
        }),
        db.selectDistinct({ dateOfBirth: players.dateOfBirth }).from(players),
      ])

      const totalCount = totalRows[0]?.val ?? 0
      const totalPages = Math.ceil(totalCount / pageSize) || 1

      const availableBirthYears = Array.from(
        new Set(
          allDobRows
            .map((r) => new Date(r.dateOfBirth).getFullYear())
            .filter((y) => !isNaN(y) && y > 1900),
        ),
      ).sort((a, b) => b - a)

      const listWithDerivedKU: PlayerListItem[] = await Promise.all(
        rows.map(async (p) => {
          const admin = (p as { administration?: typeof p.administration })
            .administration
          return {
            ...p,
            ku: calculateKU(p.dateOfBirth),
            age: calculateAge(p.dateOfBirth),
            photoDataUrl: p.profilePhotoKey
              ? await getPhotoDataUrl(p.profilePhotoKey)
              : null,
            administration: admin,
          }
        }),
      )

      return {
        players: listWithDerivedKU,
        totalCount,
        page,
        pageSize,
        totalPages,
        availableBirthYears,
      }
    } catch (err: unknown) {
      logServerError('getPlayersFn', err)
      throw new Error(sanitizeErrorMessage(err, 'Gagal memuat data pemain.'))
    }
  })

// Get Single Player Detail by ID
export const getPlayerDetailFn = createServerFn({ method: 'GET' })
  .validator((opts: { id: string }) => {
    return { id: validateUUID(opts.id, 'ID Pemain') }
  })
  .handler(async ({ data }): Promise<PlayerListItem | null> => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      const player = await db.query.players.findFirst({
        where: eq(players.id, data.id),
        with: {
          administration: true,
        },
      })

      if (!player) {
        return null
      }

      const photoDataUrl = player.profilePhotoKey
        ? await getPhotoDataUrl(player.profilePhotoKey)
        : null

      return {
        ...player,
        ku: calculateKU(player.dateOfBirth),
        age: calculateAge(player.dateOfBirth),
        photoDataUrl,
        administration: player.administration,
      }
    } catch (err: unknown) {
      logServerError('getPlayerDetailFn', err)
      throw new Error(sanitizeErrorMessage(err, 'Gagal memuat detail pemain.'))
    }
  })

// Create Player
export const createPlayerFn = createServerFn({ method: 'POST' })
  .validator((data: unknown): ValidatedPlayerInput => {
    return validatePlayerPayload(data)
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
        const { key } = await savePlayerPhoto(buffer)
        savedPhotoKey = key
      }

      await db.insert(players).values({
        id: newId,
        fullName: data.fullName,
        placeOfBirth: data.placeOfBirth,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        playingPosition: data.playingPosition,
        parentName: data.parentName || null,
        parentPhone: data.parentPhone || null,
        joinDate: data.joinDate || null,
        status: data.status,
        profilePhotoKey: savedPhotoKey,
      })

      // Inisialisasi atau simpan berkas administrasi wajib siswa baru
      const regForm = data.administration?.registrationForm || 'belum_ada'
      const famCard = data.administration?.familyCard || 'belum_ada'
      const birthCert = data.administration?.birthCertificate || 'belum_ada'
      const photoDoc = data.administration?.pasPhoto || 'belum_ada'
      const adminNotes = data.administration?.notes || null

      const isComplete =
        regForm === 'ada' &&
        famCard === 'ada' &&
        birthCert === 'ada' &&
        photoDoc === 'ada'

      await db.insert(administrations).values({
        id: crypto.randomUUID(),
        playerId: newId,
        registrationForm: regForm,
        familyCard: famCard,
        birthCertificate: birthCert,
        pasPhoto: photoDoc,
        status: isComplete ? 'lengkap' : 'belum_lengkap',
        notes: adminNotes,
      })

      return { success: true, id: newId }
    } catch (err: unknown) {
      logServerError('createPlayerFn', err)
      throw new Error(
        sanitizeErrorMessage(err, 'Gagal menyimpan data pemain baru.'),
      )
    }
  })

export interface UpdatePlayerInput extends ValidatedPlayerInput {
  id: string
}

// Update Player
export const updatePlayerFn = createServerFn({ method: 'POST' })
  .validator((data: unknown): UpdatePlayerInput => {
    if (!data || typeof data !== 'object') {
      throw new Error('Data tidak valid')
    }
    const d = data as Record<string, unknown>
    const id = validateUUID(d.id, 'ID Pemain')
    const validated = validatePlayerPayload(data)
    return { ...validated, id }
  })
  .handler(async ({ data }) => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      await db
        .update(players)
        .set({
          fullName: data.fullName,
          placeOfBirth: data.placeOfBirth,
          dateOfBirth: data.dateOfBirth,
          address: data.address,
          playingPosition: data.playingPosition,
          parentName: data.parentName || null,
          parentPhone: data.parentPhone || null,
          joinDate: data.joinDate || null,
          status: data.status,
          updatedAt: new Date(),
        })
        .where(eq(players.id, data.id))

      return { success: true }
    } catch (err: unknown) {
      logServerError('updatePlayerFn', err)
      throw new Error(
        sanitizeErrorMessage(err, 'Gagal memperbarui data pemain.'),
      )
    }
  })

// Update Status Pemain
export const updatePlayerStatusFn = createServerFn({ method: 'POST' })
  .validator((opts: { id: string; status: 'active' | 'inactive' }) => {
    const id = validateUUID(opts.id, 'ID Pemain')
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
        .update(players)
        .set({
          status: data.status,
          updatedAt: new Date(),
        })
        .where(eq(players.id, data.id))

      return { success: true }
    } catch (err: unknown) {
      logServerError('updatePlayerStatusFn', err)
      throw new Error(
        sanitizeErrorMessage(err, 'Gagal memperbarui status pemain.'),
      )
    }
  })

// Delete Player
export const deletePlayerFn = createServerFn({ method: 'POST' })
  .validator((opts: { id: string }) => {
    return { id: validateUUID(opts.id, 'ID Pemain') }
  })
  .handler(async ({ data }) => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      const rows = await db
        .select({ profilePhotoKey: players.profilePhotoKey })
        .from(players)
        .where(eq(players.id, data.id))
        .limit(1)

      if (rows.length > 0 && rows[0].profilePhotoKey) {
        await deletePlayerPhoto(rows[0].profilePhotoKey)
      }

      await db.delete(players).where(eq(players.id, data.id))
      return { success: true }
    } catch (err: unknown) {
      logServerError('deletePlayerFn', err)
      throw new Error(sanitizeErrorMessage(err, 'Gagal menghapus data pemain.'))
    }
  })

// Upload atau Replace PP
export const uploadPlayerPhotoFn = createServerFn({ method: 'POST' })
  .validator(
    (opts: { playerId: string; fileBase64: string; fileName?: string }) => {
      const playerId = validateUUID(opts.playerId, 'ID Pemain')
      if (!opts.fileBase64 || typeof opts.fileBase64 !== 'string') {
        throw new Error('Data foto wajib disertakan.')
      }
      if (!opts.fileBase64.startsWith('data:image/')) {
        throw new Error('Format berkas gambar tidak valid.')
      }
      return { playerId, fileBase64: opts.fileBase64 }
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
        .from(players)
        .where(eq(players.id, data.playerId))
        .limit(1)

      if (rows.length === 0) {
        throw new Error('Data pemain tidak ditemukan.')
      }

      const existingPlayer = rows[0]
      const base64Data = data.fileBase64.replace(/^data:[^;]+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      // Validasi ukuran berkas, magic bytes, dan kompresi WebP
      const { key } = await savePlayerPhoto(buffer)

      // Hapus berkas foto lama jika ada
      if (existingPlayer.profilePhotoKey) {
        await deletePlayerPhoto(existingPlayer.profilePhotoKey)
      }

      await db
        .update(players)
        .set({
          profilePhotoKey: key,
          updatedAt: new Date(),
        })
        .where(eq(players.id, data.playerId))

      const photoDataUrl = await getPhotoDataUrl(key)
      return { success: true, key, photoDataUrl }
    } catch (err: unknown) {
      logServerError('uploadPlayerPhotoFn', err)
      throw new Error(
        sanitizeErrorMessage(err, 'Gagal mengunggah foto profil pemain.'),
      )
    }
  })

// Remove Player Profile Photo
export const deletePlayerPhotoFn = createServerFn({ method: 'POST' })
  .validator((opts: { playerId: string }) => {
    return { playerId: validateUUID(opts.playerId, 'ID Pemain') }
  })
  .handler(async ({ data }) => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      const rows = await db
        .select()
        .from(players)
        .where(eq(players.id, data.playerId))
        .limit(1)

      if (rows.length === 0) {
        throw new Error('Data pemain tidak ditemukan.')
      }

      const existingPlayer = rows[0]
      if (existingPlayer.profilePhotoKey) {
        await deletePlayerPhoto(existingPlayer.profilePhotoKey)
      }

      await db
        .update(players)
        .set({
          profilePhotoKey: null,
          updatedAt: new Date(),
        })
        .where(eq(players.id, data.playerId))

      return { success: true }
    } catch (err: unknown) {
      logServerError('deletePlayerPhotoFn', err)
      throw new Error(
        sanitizeErrorMessage(err, 'Gagal menghapus foto profil pemain.'),
      )
    }
  })

// Get Protected Player Profile Photo
export const getPlayerPhotoFn = createServerFn({ method: 'GET' })
  .validator((opts: { playerId: string }) => {
    return { playerId: validateUUID(opts.playerId, 'ID Pemain') }
  })
  .handler(async ({ data }) => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      const rows = await db
        .select({ profilePhotoKey: players.profilePhotoKey })
        .from(players)
        .where(eq(players.id, data.playerId))
        .limit(1)

      if (rows.length === 0 || !rows[0].profilePhotoKey) {
        return { photoDataUrl: null }
      }

      const photoDataUrl = await getPhotoDataUrl(rows[0].profilePhotoKey)
      return { photoDataUrl }
    } catch (err: unknown) {
      logServerError('getPlayerPhotoFn', err)
      return { photoDataUrl: null }
    }
  })
