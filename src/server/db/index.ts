import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../../lib/env'
import * as schema from './schema'

// Bersihkan koneksi / cache jika ada error di database
declare global {
  var __db_client: postgres.Sql | undefined
}

const connectionString = env.DATABASE_URL

export const queryClient =
  globalThis.__db_client ||
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 5,
  })

if (env.NODE_ENV !== 'production') {
  globalThis.__db_client = queryClient
}

export const db = drizzle(queryClient, { schema })

export interface DatabaseHealth {
  connected: boolean
  databaseName?: string
  latencyMs?: number
  error?: string
}

// Validasi konektivitas database
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const startTime = Date.now()
  try {
    const result =
      await queryClient`SELECT current_database() as db_name, 1 as alive`
    const latencyMs = Date.now() - startTime
    return {
      connected: true,
      databaseName: String(result[0].db_name),
      latencyMs,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      connected: false,
      error: message,
    }
  }
}
