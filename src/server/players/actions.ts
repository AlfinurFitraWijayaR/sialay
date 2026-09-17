import crypto from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import { count, desc, eq } from 'drizzle-orm'
import { calculateAge, calculateKU } from '../../lib/player-utils'
import { getCurrentSession } from '../auth/session'
import { db } from '../db'
import type { Player } from '../db/schema'
import { players } from '../db/schema'

export interface PlayerListItem extends Player {
  ku: string
  age: number | null
}

export interface PaginatedPlayersResult {
  players: PlayerListItem[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Server Function: Get Paginated Players List
 */
export const getPlayersFn = createServerFn({ method: 'GET' })
  .validator((opts?: { page?: number; pageSize?: number }) => {
    const page = Math.max(1, Number(opts?.page || 1))
    const pageSize = Math.min(50, Math.max(5, Number(opts?.pageSize || 15)))
    return { page, pageSize }
  })
  .handler(async ({ data }): Promise<PaginatedPlayersResult> => {
    const auth = await getCurrentSession()
    if (!auth) {
      throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
    }

    const { page, pageSize } = data
    const offset = (page - 1) * pageSize

    const [totalRows, rows] = await Promise.all([
      db.select({ val: count() }).from(players),
      db
        .select()
        .from(players)
        .orderBy(desc(players.createdAt))
        .limit(pageSize)
        .offset(offset),
    ])

    const totalCount = totalRows[0]?.val ?? 0
    const totalPages = Math.ceil(totalCount / pageSize) || 1

    const listWithDerivedKU: PlayerListItem[] = rows.map((p) => ({
      ...p,
      ku: calculateKU(p.dateOfBirth),
      age: calculateAge(p.dateOfBirth),
    }))

    return {
      players: listWithDerivedKU,
      totalCount,
      page,
      pageSize,
      totalPages,
    }
  })

/**
 * Server Function: Get Single Player Detail by ID
 */
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
    return {
      ...player,
      ku: calculateKU(player.dateOfBirth),
      age: calculateAge(player.dateOfBirth),
    }
  })

export interface CreatePlayerInput {
  fullName: string
  placeOfBirth: string
  dateOfBirth: string
  address: string
  playingPosition: string
  parentName: string
  parentPhone: string
  joinDate?: string
  status?: string
}

/**
 * Server Function: Create New Player
 */
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
    if (
      !d.parentName ||
      typeof d.parentName !== 'string' ||
      d.parentName.trim() === ''
    ) {
      throw new Error('Nama orang tua/wali wajib diisi')
    }
    if (
      !d.parentPhone ||
      typeof d.parentPhone !== 'string' ||
      d.parentPhone.trim() === ''
    ) {
      throw new Error('Nomor telepon/WhatsApp orang tua wajib diisi')
    }

    return {
      fullName: d.fullName.trim(),
      placeOfBirth: d.placeOfBirth.trim(),
      dateOfBirth: d.dateOfBirth.trim(),
      address: d.address.trim(),
      playingPosition: d.playingPosition.trim(),
      parentName: d.parentName.trim(),
      parentPhone: d.parentPhone.trim(),
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

    const newId = crypto.randomUUID()

    await db.insert(players).values({
      id: newId,
      fullName: data.fullName,
      placeOfBirth: data.placeOfBirth,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      playingPosition: data.playingPosition,
      parentName: data.parentName,
      parentPhone: data.parentPhone,
      joinDate: data.joinDate || null,
      status: data.status || 'active',
    })

    return { success: true, id: newId }
  })

export interface UpdatePlayerInput extends CreatePlayerInput {
  id: string
}

/**
 * Server Function: Update Player Details
 */
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
    if (
      !d.parentName ||
      typeof d.parentName !== 'string' ||
      d.parentName.trim() === ''
    ) {
      throw new Error('Nama orang tua/wali wajib diisi')
    }
    if (
      !d.parentPhone ||
      typeof d.parentPhone !== 'string' ||
      d.parentPhone.trim() === ''
    ) {
      throw new Error('Nomor telepon orang tua wajib diisi')
    }

    return {
      id: d.id.trim(),
      fullName: d.fullName.trim(),
      placeOfBirth: d.placeOfBirth.trim(),
      dateOfBirth: d.dateOfBirth.trim(),
      address: d.address.trim(),
      playingPosition: d.playingPosition.trim(),
      parentName: d.parentName.trim(),
      parentPhone: d.parentPhone.trim(),
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
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        joinDate: data.joinDate || null,
        status: data.status || 'active',
        updatedAt: new Date(),
      })
      .where(eq(players.id, data.id))

    return { success: true }
  })

/**
 * Server Function: Quick Toggle Status
 */
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

/**
 * Server Function: Delete Player
 */
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

    await db.delete(players).where(eq(players.id, data.id))
    return { success: true }
  })
