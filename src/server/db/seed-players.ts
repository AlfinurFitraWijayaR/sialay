import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db } from './index'
import { administrations, players } from './schema'

interface ParsedPlayerCSV {
  fullName: string
  placeOfBirth: string
  dateOfBirth: string
  address: string
  playingPosition: 'Keeper' | 'Bek' | 'Gelandang' | 'Penyerang'
}

// Siklus distribusi posisi realistis sepak bola (~10% Kiper, ~30% Bek, ~40% Gelandang, ~20% Penyerang)
const POSITION_CYCLE: ('Keeper' | 'Bek' | 'Gelandang' | 'Penyerang')[] = [
  'Keeper',
  'Bek',
  'Bek',
  'Bek',
  'Gelandang',
  'Gelandang',
  'Gelandang',
  'Gelandang',
  'Penyerang',
  'Penyerang',
]

/**
 * Parsing satu baris CSV dengan dukungan tanda kutip (escaped commas)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result.map((col) => col.replace(/^"(.*)"$/, '$1').trim())
}

/**
 * Mengubah string teks ke Title Case yang rapi
 */
function toTitleCase(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(/([\s,/.-]+)/)
    .map((part) => {
      if (/^[\s,/.-]+$/.test(part)) return part
      if (['dan', 'di', 'ke', 'dari'].includes(part)) return part
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join('')
    .trim()
}

/**
 * Mengonversi tanggal M/D/YYYY ke format ISO YYYY-MM-DD
 */
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null
  const month = parts[0].padStart(2, '0')
  const day = parts[1].padStart(2, '0')
  const year = parts[2]
  return `${year}-${month}-${day}`
}

export async function seedPlayers(options?: { resetExisting?: boolean }) {
  console.log('⚽ Memulai proses seeding data pemain SSB Mundinglaya...')

  const csvPath = path.resolve(process.cwd(), 'data_players.csv')
  if (!fs.existsSync(csvPath)) {
    throw new Error(`File data_players.csv tidak ditemukan di ${csvPath}`)
  }

  const content = fs.readFileSync(csvPath, 'utf-8')
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const dataLines = lines.slice(1) // Lewati header CSV

  console.log(`📄 Ditemukan ${dataLines.length} baris data pada data_players.csv`)

  const parsedPlayers: ParsedPlayerCSV[] = []
  const seen = new Set<string>()
  let posIdx = 0

  for (let i = 0; i < dataLines.length; i++) {
    const cols = parseCSVLine(dataLines[i])
    const rawName = cols[0] || ''
    const rawPob = cols[1] || ''
    const rawDob = cols[2] || ''
    const rawAddress = cols[3] || ''

    if (!rawName.trim()) continue

    const fullName = toTitleCase(rawName)
    // Penanganan tempat lahir kosong: fallback ke 'Majalengka'
    const placeOfBirth = rawPob ? toTitleCase(rawPob) : 'Majalengka'
    const dateOfBirth = parseDate(rawDob)
    if (!dateOfBirth) {
      console.warn(`⚠️ Format tanggal tidak valid pada baris ${i + 2}: "${rawDob}". Dilewati.`)
      continue
    }

    const address = toTitleCase(rawAddress) || 'Majalengka'

    // Deteksi duplikasi data (berdasarkan nama & tanggal lahir yang identik)
    const dedupeKey = `${fullName.toLowerCase()}|${dateOfBirth}`
    if (seen.has(dedupeKey)) {
      console.log(`ℹ️ [Deduplikasi] Melewati data ganda: "${fullName}" (${dateOfBirth}) di baris ${i + 2}`)
      continue
    }
    seen.add(dedupeKey)

    // Penanganan posisi kosong: alokasikan posisi sepak bola secara proporsional
    const playingPosition = POSITION_CYCLE[posIdx % POSITION_CYCLE.length]
    posIdx++

    parsedPlayers.push({
      fullName,
      placeOfBirth,
      dateOfBirth,
      address,
      playingPosition,
    })
  }

  console.log(`✨ Total data valid & unik yang siap di-seed: ${parsedPlayers.length} pemain.`)

  // Opsi reset data jika diminta
  if (options?.resetExisting) {
    console.log('🧹 Membersihkan data pemain dan administrasi lama...')
    await db.delete(administrations)
    await db.delete(players)
    console.log('✅ Data lama berhasil dibersihkan.')
  }

  let insertedCount = 0
  let skippedCount = 0

  const posStats = {
    Keeper: 0,
    Bek: 0,
    Gelandang: 0,
    Penyerang: 0,
  }

  let lengkapAdminCount = 0

  for (let idx = 0; idx < parsedPlayers.length; idx++) {
    const item = parsedPlayers[idx]

    // Cek apakah sudah ada pemain dengan nama & tanggal lahir yang sama
    const existing = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.fullName, item.fullName))
      .limit(1)

    if (existing.length > 0 && !options?.resetExisting) {
      skippedCount++
      continue
    }

    const playerId = crypto.randomUUID()
    const now = new Date()

    // 1. Simpan data pemain
    await db.insert(players).values({
      id: playerId,
      fullName: item.fullName,
      placeOfBirth: item.placeOfBirth,
      dateOfBirth: item.dateOfBirth,
      address: item.address,
      playingPosition: item.playingPosition,
      parentName: null,
      parentPhone: null,
      joinDate: '2024-01-01',
      status: 'active',
      profilePhotoKey: null,
      createdAt: now,
      updatedAt: now,
    })

    // 2. Simpan relasi administrasi (simulasi realistis: ~25% lengkap, 75% proses/belum)
    const isLengkap = idx % 4 === 0 // 1 dari 4 pemain berkasnya lengkap
    const formAda = isLengkap || idx % 2 === 0 ? 'ada' : 'belum_ada'
    const kkAda = isLengkap || idx % 3 === 0 ? 'ada' : 'belum_ada'
    const akteAda = isLengkap ? 'ada' : idx % 5 === 0 ? 'ada' : 'belum_ada'
    const fotoAda = isLengkap ? 'ada' : idx % 4 === 1 ? 'ada' : 'belum_ada'

    const adminStatus = isLengkap ? 'lengkap' : 'belum_lengkap'
    if (isLengkap) lengkapAdminCount++

    await db.insert(administrations).values({
      id: crypto.randomUUID(),
      playerId,
      registrationForm: formAda,
      familyCard: kkAda,
      birthCertificate: akteAda,
      pasPhoto: fotoAda,
      status: adminStatus,
      notes: isLengkap
        ? 'Berkas pendaftaran sudah diverifikasi lengkap.'
        : 'Menunggu kelengkapan dokumen persyaratan.',
      createdAt: now,
      updatedAt: now,
    })

    posStats[item.playingPosition]++
    insertedCount++
  }

  console.log('\n=============================================')
  console.log('🎉 SEEDING SELESAI!')
  console.log('=============================================')
  console.log(`✅ Berhasil di-insert : ${insertedCount} pemain`)
  if (skippedCount > 0) {
    console.log(`⏩ Dilewati (sudah ada) : ${skippedCount} pemain`)
  }
  console.log('\n📊 Distribusi Posisi Pemain:')
  console.log(`   - Keeper     : ${posStats.Keeper} pemain`)
  console.log(`   - Bek        : ${posStats.Bek} pemain`)
  console.log(`   - Gelandang  : ${posStats.Gelandang} pemain`)
  console.log(`   - Penyerang  : ${posStats.Penyerang} pemain`)
  console.log('\n📑 Administrasi Dokumen:')
  console.log(`   - Berkas Lengkap (Sudah) : ${lengkapAdminCount} siswa`)
  console.log(`   - Belum Lengkap (Belum)  : ${insertedCount - lengkapAdminCount} siswa`)
  console.log('=============================================\n')
}

// Eksekusi jika dipanggil langsung via CLI
if (process.argv[1]?.includes('seed-players')) {
  const resetArg = process.argv.includes('--reset') || process.argv.includes('--clean')
  seedPlayers({ resetExisting: resetArg })
    .then(() => {
      process.exit(0)
    })
    .catch((err) => {
      console.error('❌ Gagal melakukan seeding pemain:', err)
      process.exit(1)
    })
}
