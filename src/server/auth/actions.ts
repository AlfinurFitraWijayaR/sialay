import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { admins } from '../db/schema'
import { logServerError, sanitizeErrorMessage } from '../security/error-handler'
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  recordFailedLogin,
} from '../security/rate-limiter'
import type { ValidatedLoginInput } from '../security/validation'
import { validateLoginPayload } from '../security/validation'
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

export const loginFn = createServerFn({ method: 'POST' })
  .validator((data: unknown): ValidatedLoginInput => {
    return validateLoginPayload(data)
  })
  .handler(async ({ data }): Promise<LoginResult> => {
    const rateLimitKey = data.username.toLowerCase().trim()

    // 1. Cek Rate Limiting (Abuse Protection)
    const rateCheck = checkLoginRateLimit(rateLimitKey)
    if (!rateCheck.allowed) {
      const waitMinutes = Math.ceil((rateCheck.retryAfterSeconds ?? 60) / 60)
      return {
        success: false,
        error: `Terlalu banyak percobaan login yang gagal. Silakan coba lagi dalam ${waitMinutes} menit.`,
      }
    }

    try {
      const results = await db
        .select()
        .from(admins)
        .where(eq(admins.username, data.username))
        .limit(1)

      if (results.length === 0) {
        const failStatus = recordFailedLogin(rateLimitKey)
        if (failStatus.locked) {
          return {
            success: false,
            error: 'Terlalu banyak percobaan gagal. Tunggu selama 15 menit.',
          }
        }
        return {
          success: false,
          error: 'Username atau kata sandi tidak valid.',
        }
      }

      const admin = results[0]

      const isMatch = await verifyPassword(data.password, admin.passwordHash)
      if (!isMatch) {
        const failStatus = recordFailedLogin(rateLimitKey)
        if (failStatus.locked) {
          return {
            success: false,
            error: 'Terlalu banyak percobaan gagal. tunggu selama 15 menit.',
          }
        }
        return {
          success: false,
          error: 'Username atau kata sandi tidak valid.',
        }
      }

      // Login berhasil: reset catatan percobaan gagal
      clearLoginRateLimit(rateLimitKey)

      await createAdminSession(admin.id)
      return { success: true }
    } catch (err: unknown) {
      logServerError('loginFn', err)
      return {
        success: false,
        error: sanitizeErrorMessage(
          err,
          'Terjadi kesalahan pada sistem saat memproses login.',
        ),
      }
    }
  })

// Administrator Logout
export const logoutFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ success: boolean }> => {
    try {
      await destroyCurrentSession()
      return { success: true }
    } catch (err: unknown) {
      logServerError('logoutFn', err)
      return { success: true } // Tetap kembalikan true agar client membersihkan state lokal
    }
  },
)

// Mendapatkan info admin yang sedang login
export const getAuthSessionFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthenticatedAdmin | null> => {
    try {
      const auth = await getCurrentSession()
      return auth?.admin ?? null
    } catch (err: unknown) {
      logServerError('getAuthSessionFn', err)
      return null
    }
  },
)
