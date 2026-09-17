import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { admins } from '../db/schema'
import { verifyPassword } from './security'
import type { AuthenticatedAdmin } from './session'
import {
  createAdminSession,
  destroyCurrentSession,
  getCurrentSession,
} from './session'

export interface LoginResult {
  success: boolean
  error?: string
}

// Administrator Login
export const loginFn = createServerFn({ method: 'POST' })
  .validator((data: unknown): { username: string; password: string } => {
    if (!data || typeof data !== 'object') {
      throw new Error('Data login tidak valid')
    }
    const { username, password } = data as Record<string, unknown>
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error('Username wajib diisi')
    }
    if (!password || typeof password !== 'string' || password === '') {
      throw new Error('Kata sandi wajib diisi')
    }
    return {
      username: username.trim(),
      password,
    }
  })
  .handler(async ({ data }): Promise<LoginResult> => {
    try {
      const results = await db
        .select()
        .from(admins)
        .where(eq(admins.username, data.username))
        .limit(1)

      if (results.length === 0) {
        return {
          success: false,
          error: 'Username atau kata sandi tidak valid.',
        }
      }

      const admin = results[0]

      const isMatch = await verifyPassword(data.password, admin.passwordHash)
      if (!isMatch) {
        return {
          success: false,
          error: 'Username atau kata sandi tidak valid.',
        }
      }

      await createAdminSession(admin.id)
      return { success: true }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
      return {
        success: false,
        error: message,
      }
    }
  })

//  Administrator Logout
export const logoutFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ success: boolean }> => {
    await destroyCurrentSession()
    return { success: true }
  },
)

// Mendapatkan info admin yang sedang login
export const getAuthSessionFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthenticatedAdmin | null> => {
    const auth = await getCurrentSession()
    return auth?.admin ?? null
  },
)
