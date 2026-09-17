import crypto from 'node:crypto'
import 'dotenv/config'
import { count } from 'drizzle-orm'
import { env } from '../../lib/env'
import { hashPassword } from '../auth/security'
import { db } from './index'
import { admins } from './schema'

export async function seedAdmin() {
  console.log('🌱 Memeriksa akun administrator...')

  const existingCount = await db.select({ val: count() }).from(admins)
  if (existingCount[0].val > 0) {
    const existing = await db
      .select({ username: admins.username })
      .from(admins)
      .limit(1)
    console.log(
      `ℹ️ Akun admin sudah ada di database (username: ${existing[0].username}).`,
    )
    return
  }

  const username = env.ADMIN_USERNAME || 'admin'
  const password = env.ADMIN_PASSWORD || 'admin'

  console.log(`🔐 Membuat akun administrator baru (${username})...`)
  const hashedPassword = await hashPassword(password)

  await db.insert(admins).values({
    id: crypto.randomUUID(),
    username,
    passwordHash: hashedPassword,
  })

  console.log('✅ Akun administrator berhasil dibuat!')
  console.log(`   Username: ${username}`)
}

// If run directly from CLI
if (process.argv[1]?.includes('seed-admin')) {
  seedAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Gagal membuat akun admin:', err)
      process.exit(1)
    })
}
