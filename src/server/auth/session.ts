import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import type { Session } from '../db/schema'
import { admins, sessions } from '../db/schema'
import { generateSessionToken } from './security'

export const SESSION_COOKIE_NAME = 'ssb_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

export interface AuthenticatedAdmin {
  id: string
  username: string
}

export interface SessionValidationResult {
  session: Session
  admin: AuthenticatedAdmin
}

// Membuat session baru di database dan mengatur cookie HTTP-only
export async function createAdminSession(adminId: string): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)

  await db.insert(sessions).values({
    id: token,
    adminId,
    expiresAt,
  })

  setCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })

  return token
}

// Validasi session cookie HTTP saat ini terhadap database
export async function getCurrentSession(): Promise<SessionValidationResult | null> {
  const token = getCookie(SESSION_COOKIE_NAME)
  if (!token) {
    return null
  }

  const results = await db
    .select({
      session: sessions,
      admin: {
        id: admins.id,
        username: admins.username,
      },
    })
    .from(sessions)
    .innerJoin(admins, eq(sessions.adminId, admins.id))
    .where(eq(sessions.id, token))
    .limit(1)

  if (results.length === 0) {
    deleteCookie(SESSION_COOKIE_NAME, { path: '/' })
    return null
  }

  const found = results[0]

  // Cek kedaluwarsa session
  if (found.session.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, token))
    deleteCookie(SESSION_COOKIE_NAME, { path: '/' })
    return null
  }

  return found
}

// Menghapus session saat ini dari database dan menghapus cookie
export async function destroyCurrentSession(): Promise<void> {
  const token = getCookie(SESSION_COOKIE_NAME)
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token))
  }
  deleteCookie(SESSION_COOKIE_NAME, { path: '/' })
}
