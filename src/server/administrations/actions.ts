import crypto from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { calculateKU } from '../../lib/player-utils'
import { getCurrentSession } from '../auth/session'
import { db } from '../db'
import { administrations, players } from '../db/schema'
import { logServerError, sanitizeErrorMessage } from '../security/error-handler'
import { sanitizeText, validateUUID } from '../security/validation'

export type DocStatus = 'ada' | 'belum_ada'

export interface PlayerAdministrationItem {
  player: {
    id: string
    fullName: string
    playingPosition: string
    dateOfBirth: string
    ku: string
    status: string
  }
  administration: {
    id?: string
    registrationForm: DocStatus
    familyCard: DocStatus
    birthCertificate: DocStatus
    pasPhoto: DocStatus
    status: 'lengkap' | 'belum_lengkap'
    notes?: string | null
    updatedAt?: string | null
  }
  docSummary: {
    collectedCount: number
    totalRequired: number
    isComplete: boolean
  }
}

export interface AdministrationsOverview {
  items: PlayerAdministrationItem[]
  stats: {
    totalPlayers: number
    completeCount: number
    incompleteCount: number
    completionRate: number
    docBreakdown: {
      registrationForm: number
      familyCard: number
      birthCertificate: number
      pasPhoto: number
    }
  }
  pagination: {
    page: number
    pageSize: number
    totalFiltered: number
    totalPages: number
  }
}

export interface GetAdministrationsFilter {
  page?: number
  pageSize?: number
  search?: string
  status?: 'all' | 'lengkap' | 'belum_lengkap'
}

// 1. Mengambil data administrasi seluruh siswa dengan filter cepat & agregat statistik
export const getAdministrationsOverviewFn = createServerFn({ method: 'GET' })
  .validator((opts: unknown): GetAdministrationsFilter => {
    const filter = (typeof opts === 'object' && opts !== null
      ? opts
      : {}) as GetAdministrationsFilter
    return {
      page: Math.max(1, Number(filter.page) || 1),
      pageSize: Math.min(100, Math.max(5, Number(filter.pageSize) || 20)),
      search: filter.search ? sanitizeText(String(filter.search)) : undefined,
      status:
        filter.status === 'lengkap' || filter.status === 'belum_lengkap'
          ? filter.status
          : 'all',
    }
  })
  .handler(async ({ data }): Promise<AdministrationsOverview> => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      // Ambil seluruh pemain beserta data administrasi terkait via Drizzle Relational Query
      const allPlayersWithAdmin = await db.query.players.findMany({
        with: {
          administration: true,
        },
        orderBy: [desc(players.createdAt)],
      })

      // Hitung agregat statistik global
      let globalComplete = 0
      let countReg = 0
      let countKk = 0
      let countAkte = 0
      let countPhoto = 0

      const mappedList: PlayerAdministrationItem[] = allPlayersWithAdmin.map(
        (p) => {
          const admin = p.administration as unknown as
            | (typeof administrations.$inferSelect)
            | null
            | undefined
          const regForm: DocStatus = admin
            ? (admin.registrationForm as DocStatus)
            : 'belum_ada'
          const famCard: DocStatus = admin
            ? (admin.familyCard as DocStatus)
            : 'belum_ada'
          const birthCert: DocStatus = admin
            ? (admin.birthCertificate as DocStatus)
            : 'belum_ada'
          const pasPhoto: DocStatus = admin
            ? (admin.pasPhoto as DocStatus)
            : 'belum_ada'

          if (regForm === 'ada') countReg++
          if (famCard === 'ada') countKk++
          if (birthCert === 'ada') countAkte++
          if (pasPhoto === 'ada') countPhoto++

          let collected = 0
          if (regForm === 'ada') collected++
          if (famCard === 'ada') collected++
          if (birthCert === 'ada') collected++
          if (pasPhoto === 'ada') collected++

          const isComplete = collected === 4
          if (isComplete) globalComplete++

          return {
            player: {
              id: p.id,
              fullName: p.fullName,
              playingPosition: p.playingPosition,
              dateOfBirth: p.dateOfBirth,
              ku: calculateKU(p.dateOfBirth),
              status: p.status,
            },
            administration: {
              id: admin?.id,
              registrationForm: regForm,
              familyCard: famCard,
              birthCertificate: birthCert,
              pasPhoto: pasPhoto,
              status: isComplete ? 'lengkap' : 'belum_lengkap',
              notes: admin?.notes,
              updatedAt: admin?.updatedAt ? admin.updatedAt.toISOString() : null,
            },
            docSummary: {
              collectedCount: collected,
              totalRequired: 4,
              isComplete,
            },
          }
        },
      )

      const totalPlayers = mappedList.length
      const incompleteCount = totalPlayers - globalComplete
      const completionRate =
        totalPlayers > 0
          ? Math.round((globalComplete / totalPlayers) * 100)
          : 0

      // Filter pencarian dan status
      let filtered = mappedList
      if (data.search) {
        const query = data.search.toLowerCase()
        filtered = filtered.filter((item) =>
          item.player.fullName.toLowerCase().includes(query),
        )
      }

      if (data.status && data.status !== 'all') {
        filtered = filtered.filter((item) =>
          data.status === 'lengkap'
            ? item.docSummary.isComplete
            : !item.docSummary.isComplete,
        )
      }

      // Pagination
      const page = data.page || 1
      const pageSize = data.pageSize || 20
      const totalFiltered = filtered.length
      const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
      const startIndex = (page - 1) * pageSize
      const paginatedItems = filtered.slice(startIndex, startIndex + pageSize)

      return {
        items: paginatedItems,
        stats: {
          totalPlayers,
          completeCount: globalComplete,
          incompleteCount,
          completionRate,
          docBreakdown: {
            registrationForm: countReg,
            familyCard: countKk,
            birthCertificate: countAkte,
            pasPhoto: countPhoto,
          },
        },
        pagination: {
          page,
          pageSize,
          totalFiltered,
          totalPages,
        },
      }
    } catch (err: unknown) {
      logServerError('getAdministrationsOverviewFn', err)
      throw new Error(
        sanitizeErrorMessage(err, 'Gagal memuat data administrasi.'),
      )
    }
  })

// 2. Simpan atau perbarui status administrasi siswa (Atomic Upsert)
export interface SaveAdministrationInput {
  playerId: string
  registrationForm: DocStatus
  familyCard: DocStatus
  birthCertificate: DocStatus
  pasPhoto: DocStatus
  notes?: string
}

export const savePlayerAdministrationFn = createServerFn({ method: 'POST' })
  .validator((opts: unknown): SaveAdministrationInput => {
    const input = opts as Partial<SaveAdministrationInput>
    if (!input.playerId) {
      throw new Error('ID Siswa wajib disertakan')
    }

    const validateStatus = (val: unknown): DocStatus => {
      return val === 'ada' ? 'ada' : 'belum_ada'
    }

    return {
      playerId: validateUUID(input.playerId, 'ID Siswa'),
      registrationForm: validateStatus(input.registrationForm),
      familyCard: validateStatus(input.familyCard),
      birthCertificate: validateStatus(input.birthCertificate),
      pasPhoto: validateStatus(input.pasPhoto),
      notes: input.notes ? sanitizeText(input.notes) : undefined,
    }
  })
  .handler(async ({ data }): Promise<{ success: boolean; status: string }> => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      // Verifikasi pemain ada di database
      const playerRows = await db
        .select({ id: players.id })
        .from(players)
        .where(eq(players.id, data.playerId))
        .limit(1)

      if (playerRows.length === 0) {
        throw new Error('Data siswa tidak ditemukan.')
      }

      const isComplete =
        data.registrationForm === 'ada' &&
        data.familyCard === 'ada' &&
        data.birthCertificate === 'ada' &&
        data.pasPhoto === 'ada'

      const status = isComplete ? 'lengkap' : 'belum_lengkap'
      const newId = crypto.randomUUID()
      const now = new Date()

      // Atomic Single-Roundtrip Upsert
      await db
        .insert(administrations)
        .values({
          id: newId,
          playerId: data.playerId,
          registrationForm: data.registrationForm,
          familyCard: data.familyCard,
          birthCertificate: data.birthCertificate,
          pasPhoto: data.pasPhoto,
          status,
          notes: data.notes || null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: administrations.playerId,
          set: {
            registrationForm: data.registrationForm,
            familyCard: data.familyCard,
            birthCertificate: data.birthCertificate,
            pasPhoto: data.pasPhoto,
            status,
            notes: data.notes || null,
            updatedAt: now,
          },
        })

      return { success: true, status }
    } catch (err: unknown) {
      logServerError('savePlayerAdministrationFn', err)
      throw new Error(
        sanitizeErrorMessage(err, 'Gagal menyimpan berkas administrasi.'),
      )
    }
  })

// 3. Quick Toggle status satu dokumen (Formulir / KK / Akte / Pas Photo)
export interface QuickToggleDocInput {
  playerId: string
  docType: 'registrationForm' | 'familyCard' | 'birthCertificate' | 'pasPhoto'
}

export const quickToggleDocFn = createServerFn({ method: 'POST' })
  .validator((opts: unknown): QuickToggleDocInput => {
    const input = opts as Partial<QuickToggleDocInput>
    const validDocs = [
      'registrationForm',
      'familyCard',
      'birthCertificate',
      'pasPhoto',
    ]
    if (!input.docType || !validDocs.includes(input.docType)) {
      throw new Error('Jenis dokumen tidak valid')
    }
    return {
      playerId: validateUUID(input.playerId, 'ID Siswa'),
      docType: input.docType,
    }
  })
  .handler(
    async ({
      data,
    }): Promise<{
      success: boolean
      newStatus: DocStatus
      overallStatus: string
    }> => {
      try {
        const auth = await getCurrentSession()
        if (!auth) {
          throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
        }

        const existing = await db
          .select()
          .from(administrations)
          .where(eq(administrations.playerId, data.playerId))
          .limit(1)

        let regForm: DocStatus = 'belum_ada'
        let famCard: DocStatus = 'belum_ada'
        let birthCert: DocStatus = 'belum_ada'
        let pasPhoto: DocStatus = 'belum_ada'
        let notes: string | null = null

        if (existing.length > 0) {
          const row = existing[0]
          regForm = row.registrationForm as DocStatus
          famCard = row.familyCard as DocStatus
          birthCert = row.birthCertificate as DocStatus
          pasPhoto = row.pasPhoto as DocStatus
          notes = row.notes
        }

        // Toggle dokumen yang dipilih
        let nextDocVal: DocStatus = 'ada'
        if (data.docType === 'registrationForm') {
          nextDocVal = regForm === 'ada' ? 'belum_ada' : 'ada'
          regForm = nextDocVal
        } else if (data.docType === 'familyCard') {
          nextDocVal = famCard === 'ada' ? 'belum_ada' : 'ada'
          famCard = nextDocVal
        } else if (data.docType === 'birthCertificate') {
          nextDocVal = birthCert === 'ada' ? 'belum_ada' : 'ada'
          birthCert = nextDocVal
        } else {
          nextDocVal = pasPhoto === 'ada' ? 'belum_ada' : 'ada'
          pasPhoto = nextDocVal
        }

        const isComplete =
          regForm === 'ada' &&
          famCard === 'ada' &&
          birthCert === 'ada' &&
          pasPhoto === 'ada'

        const status = isComplete ? 'lengkap' : 'belum_lengkap'
        const now = new Date()

        await db
          .insert(administrations)
          .values({
            id: crypto.randomUUID(),
            playerId: data.playerId,
            registrationForm: regForm,
            familyCard: famCard,
            birthCertificate: birthCert,
            pasPhoto: pasPhoto,
            status,
            notes,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: administrations.playerId,
            set: {
              registrationForm: regForm,
              familyCard: famCard,
              birthCertificate: birthCert,
              pasPhoto: pasPhoto,
              status,
              updatedAt: now,
            },
          })

        return {
          success: true,
          newStatus: nextDocVal,
          overallStatus: status,
        }
      } catch (err: unknown) {
        logServerError('quickToggleDocFn', err)
        throw new Error(
          sanitizeErrorMessage(err, 'Gagal memperbarui status dokumen.'),
        )
      }
    },
  )
