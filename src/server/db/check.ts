import 'dotenv/config'
import { checkDatabaseHealth } from './index'

async function runHealthCheck() {
  console.log('🔍 Memeriksa koneksi database PostgreSQL...')
  const health = await checkDatabaseHealth()

  if (health.connected) {
    console.log('✅ Koneksi database BERHASIL!')
    console.log(`   Database: ${health.databaseName}`)
    console.log(`   Latency : ${health.latencyMs}ms`)
    process.exit(0)
  } else {
    console.error('❌ Koneksi database GAGAL:')
    console.error(`   Pesan: ${health.error}`)
    console.log('\n💡 Petunjuk:')
    console.log('   1. Pastikan PostgreSQL sedang berjalan.')
    console.log('   2. Periksa variabel DATABASE_URL di file .env')
    console.log('   3. Format: postgres://USER:PASSWORD@localhost:5432/DB_NAME')
    process.exit(1)
  }
}

runHealthCheck()
