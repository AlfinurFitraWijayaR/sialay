import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

// Hashing Password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// Verifikasi Password
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Generate Session Token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
