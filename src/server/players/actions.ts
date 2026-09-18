import crypto from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import type { SQL } from 'drizzle-orm'
import { and, count, desc, eq, gte, ilike, lte } from 'drizzle-orm'
import { calculateAge, calculateKU } from '../../lib/player-utils'
import { getCurrentSession } from '../auth/session'
import { db } from '../db'
import type { Player } from '../db/schema'
import { players } from '../db/schema'
import {
  deletePlayerPhoto,
  getPhotoDataUrl,
  savePlayerPhoto,
} from '../storage/photo-storage'

export interface PlayerListItem extends Player {
  ku: string
  age: number | null
  photoDataUrl?: string | null
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

// Get Players List with Search & Filter (F06)
export const getPlayersFn = createServerFn({ method: 'GET' })
  .validator((opts?: GetPlayersFilter) => {
    const page = Math.max(1, Number(opts?.page || 1))
    const pageSize = Math.min(50, Math.max(5, Number(opts?.pageSize || 15)))
    const search =
      typeof opts?.search === 'string' && opts.search.trim() !== ''
        ? opts.search.trim()
        : undefined
    const status =
      opts?.status === 'active' || opts?.status === 'inactive'
        ? opts.status
        : undefined
    const birthYear =
      opts?.birthYear && !isNaN(Number(opts.birthYear)) && Number(opts.birthYear) > 1900
        ? Number(opts.birthYear)
        : undefined

    return { page, pageSize, search, status, birthYear }
  })
  .handler(async ({ data }): Promise<PaginatedPlayersResult> => {
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
      // PRD Section 6.1 & F06: Calculate KU from date_of_birth, no DB column
      conditions.push(gte(players.dateOfBirth, `${birthYear}-01-01`))
      conditions.push(lte(players.dateOfBirth, `${birthYear}-12-31`))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [totalRows, rows, allDobRows] = await Promise.all([
      db
        .select({ val: count() })
        .from(players)
        .where(whereClause),
      db
        .select()
        .from(players)
        .where(whereClause)
        .orderBy(desc(players.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .selectDistinct({ dateOfBirth: players.dateOfBirth })
        .from(players),
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
      rows.map(async (p) => ({
        ...p,
        ku: calculateKU(p.dateOfBirth),
        age: calculateAge(p.dateOfBirth),
        photoDataUrl: p.profilePhotoKey
          ? await getPhotoDataUrl(p.profilePhotoKey)
          : null,
      })),
    )

    return {
      players: listWithDerivedKU,
      totalCount,
      page,
      pageSize,
      totalPages,
      availableBirthYears,
    }
  })

// Get Single Player Detail by ID
export const getPlayerDetailFn = createServerFn({ method: 'GET' })
  .validator((opts: { id: string }) => {
    if (!opts.id) {
      throw new Error('ID Pemain tidak valid')
    }
    return { id: opts.id.trim() }
  })
  .handler(async ({ data }): Promise<PlayerListItem | null> => {
    const auth = await getCurrentSession()
    if (!auth) {
      throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
    }

    const results = await db
      .select()
      .from(players)
      .where(eq(players.id, data.id))
      .limit(1)

    if (results.length === 0) {
      return null
    }

    const player = results[0]
    const photoDataUrl = player.profilePhotoKey
      ? await getPhotoDataUrl(player.profilePhotoKey)
      : null

    return {
      ...player,
      ku: calculateKU(player.dateOfBirth),
      age: calculateAge(player.dateOfBirth),
      photoDataUrl,
    }
  })

export interface CreatePlayerInput {
  fullName: string
  placeOfBirth: string
  dateOfBirth: string
  address: string
  playingPosition: string
  parentName?: string
  parentPhone?: string
  joinDate?: string
  status?: string
  photoBase64?: string
}

// Create players
export const createPlayerFn = createServerFn({ method: 'POST' })
  .validator((data: unknown): CreatePlayerInput => {
    if (!data || typeof data !== 'object') {
      throw new Error('Data pemain tidak valid')
    }
    const d = data as Record<string, unknown>

    if (
      !d.fullName ||
      typeof d.fullName !== 'string' ||
      d.fullName.trim() === ''
    ) {
      throw new Error('Nama lengkap wajib diisi')
    }
    if (
      !d.placeOfBirth ||
      typeof d.placeOfBirth !== 'string' ||
      d.placeOfBirth.trim() === ''
    ) {
      throw new Error('Tempat lahir wajib diisi')
    }
    if (!d.dateOfBirth || typeof d.dateOfBirth !== 'string') {
      throw new Error('Tanggal lahir wajib diisi')
    }
    const parsedDate = new Date(d.dateOfBirth)
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Format tanggal lahir tidak valid')
    }
    if (
      !d.address ||
      typeof d.address !== 'string' ||
      d.address.trim() === ''
    ) {
      throw new Error('Alamat wajib diisi')
    }
    if (!d.playingPosition || typeof d.playingPosition !== 'string') {
      throw new Error('Posisi bermain wajib dipilih')
    }

    return {
      fullName: d.fullName.trim(),
      placeOfBirth: d.placeOfBirth.trim(),
      dateOfBirth: d.dateOfBirth.trim(),
      address: d.address.trim(),
      playingPosition: d.playingPosition.trim(),
      parentName:
        typeof d.parentName === 'string' && d.parentName.trim() !== ''
          ? d.parentName.trim()
          : undefined,
      parentPhone:
        typeof d.parentPhone === 'string' && d.parentPhone.trim() !== ''
          ? d.parentPhone.trim()
          : undefined,
      joinDate:
        typeof d.joinDate === 'string' && d.joinDate.trim() !== ''
          ? d.joinDate.trim()
          : undefined,
      status: d.status === 'inactive' ? 'inactive' : 'active',
      photoBase64:
        typeof d.photoBase64 === 'string' && d.photoBase64.trim() !== ''
          ? d.photoBase64.trim()
          : undefined,
    }
  })
  .handler(async ({ data }) => {
    const auth = await getCurrentSession()
    if (!auth) {
      throw new Error('Akses tidak diizinkan.')
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
      status: data.status || 'active',
      profilePhotoKey: savedPhotoKey,
    })

    return { success: true, id: newId }
  })

export interface UpdatePlayerInput {
  id: string
  fullName: string
  placeOfBirth: string
  dateOfBirth: string
  address: string
  playingPosition: string
  parentName?: string
  parentPhone?: string
  joinDate?: string
  status?: string
}

// Update Player
export const updatePlayerFn = createServerFn({ method: 'POST' })
  .validator((data: unknown): UpdatePlayerInput => {
    if (!data || typeof data !== 'object') {
      throw new Error('Data tidak valid')
    }
    const d = data as Record<string, unknown>
    if (!d.id || typeof d.id !== 'string') {
      throw new Error('ID Pemain wajib disertakan')
    }
    if (
      !d.fullName ||
      typeof d.fullName !== 'string' ||
      d.fullName.trim() === ''
    ) {
      throw new Error('Nama lengkap wajib diisi')
    }
    if (
      !d.placeOfBirth ||
      typeof d.placeOfBirth !== 'string' ||
      d.placeOfBirth.trim() === ''
    ) {
      throw new Error('Tempat lahir wajib diisi')
    }
    if (!d.dateOfBirth || typeof d.dateOfBirth !== 'string') {
      throw new Error('Tanggal lahir wajib diisi')
    }
    if (
      !d.address ||
      typeof d.address !== 'string' ||
      d.address.trim() === ''
    ) {
      throw new Error('Alamat wajib diisi')
    }
    if (!d.playingPosition || typeof d.playingPosition !== 'string') {
      throw new Error('Posisi bermain wajib dipilih')
    }

    return {
      id: d.id.trim(),
      fullName: d.fullName.trim(),
      placeOfBirth: d.placeOfBirth.trim(),
      dateOfBirth: d.dateOfBirth.trim(),
      address: d.address.trim(),
      playingPosition: d.playingPosition.trim(),
      parentName:
        typeof d.parentName === 'string' && d.parentName.trim() !== ''
          ? d.parentName.trim()
          : undefined,
      parentPhone:
        typeof d.parentPhone === 'string' && d.parentPhone.trim() !== ''
          ? d.parentPhone.trim()
          : undefined,
      joinDate:
        typeof d.joinDate === 'string' && d.joinDate.trim() !== ''
          ? d.joinDate.trim()
          : undefined,
      status: d.status === 'inactive' ? 'inactive' : 'active',
    }
  })
  .handler(async ({ data }) => {
    const auth = await getCurrentSession()
    if (!auth) {
      throw new Error('Akses tidak diizinkan.')
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
        status: data.status || 'active',
        updatedAt: new Date(),
      })
      .where(eq(players.id, data.id))

    return { success: true }
  })

// Update Status Pemain
export const updatePlayerStatusFn = createServerFn({ method: 'POST' })
  .validator((opts: { id: string; status: 'active' | 'inactive' }) => {
    if (!opts.id) {
      throw new Error('Parameter status tidak valid')
    }
    return opts
  })
  .handler(async ({ data }) => {
    const auth = await getCurrentSession()
    if (!auth) {
      throw new Error('Akses tidak diizinkan.')
    }

    await db
      .update(players)
      .set({
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(players.id, data.id))

    return { success: true }
  })

// Delete Players
export const deletePlayerFn = createServerFn({ method: 'POST' })
  .validator((opts: { id: string }) => {
    if (!opts.id) {
      throw new Error('ID Pemain tidak valid')
    }
    return { id: opts.id.trim() }
  })
  .handler(async ({ data }) => {
    const auth = await getCurrentSession()
    if (!auth) {
      throw new Error('Akses tidak diizinkan.')
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
  })

// Upload atau Replace PP
export const uploadPlayerPhotoFn = createServerFn({ method: 'POST' })
  .validator(
    (opts: { playerId: string; fileBase64: string; fileName?: string }) => {
      if (!opts.playerId || typeof opts.playerId !== 'string') {
        throw new Error('ID Pemain wajib disertakan.')
      }
      if (!opts.fileBase64 || typeof opts.fileBase64 !== 'string') {
        throw new Error('Data foto wajib disertakan.')
      }
      return opts
    },
  )
  .handler(async ({ data }) => {
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

    // Save new photo to private storage (validates size & magic bytes)
    const { key } = await savePlayerPhoto(buffer)

    // Delete old photo file if replacing
    if (existingPlayer.profilePhotoKey) {
      await deletePlayerPhoto(existingPlayer.profilePhotoKey)
    }

    // Update database
    await db
      .update(players)
      .set({
        profilePhotoKey: key,
        updatedAt: new Date(),
      })
      .where(eq(players.id, data.playerId))

    const photoDataUrl = await getPhotoDataUrl(key)
    return { success: true, key, photoDataUrl }
  })

// Remove Player Profile Photo
export const deletePlayerPhotoFn = createServerFn({ method: 'POST' })
  .validator((opts: { playerId: string }) => {
    if (!opts.playerId || typeof opts.playerId !== 'string') {
      throw new Error('ID Pemain wajib disertakan.')
    }
    return opts
  })
  .handler(async ({ data }) => {
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
  })

// Get Protected Player Profile Photo
export const getPlayerPhotoFn = createServerFn({ method: 'GET' })
  .validator((opts: { playerId: string }) => {
    if (!opts.playerId || typeof opts.playerId !== 'string') {
      throw new Error('ID Pemain tidak valid.')
    }
    return opts
  })
  .handler(async ({ data }) => {
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
  })
