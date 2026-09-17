import { createServerFn } from '@tanstack/react-start'
import { checkDatabaseHealth } from './index'

// Mendapatkan status sistem
export const getSystemStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const dbHealth = await checkDatabaseHealth()
    return {
      timestamp: new Date().toISOString(),
      framework: 'TanStack Start',
      database: dbHealth,
      environment: process.env.NODE_ENV || 'development',
    }
  },
)
