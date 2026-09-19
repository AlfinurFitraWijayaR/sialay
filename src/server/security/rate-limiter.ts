interface RateLimitRecord {
  attempts: number
  firstAttemptTime: number
  lockoutUntil: number | null
}

const MAX_FAILED_ATTEMPTS = 5
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000 // 15 menit
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 menit lockout

// In-memory store untuk pelacakan percobaan login
const loginAttemptsStore = new Map<string, RateLimitRecord>()

// Pembersihan berkala memori setiap 10 menit
let lastCleanup = Date.now()
function cleanupExpiredRecords() {
  const now = Date.now()
  if (now - lastCleanup < 10 * 60 * 1000) return

  lastCleanup = now
  for (const [key, record] of loginAttemptsStore.entries()) {
    const isLockoutExpired = record.lockoutUntil && record.lockoutUntil < now
    const isWindowExpired = now - record.firstAttemptTime > ATTEMPT_WINDOW_MS
    if (isLockoutExpired || (isWindowExpired && !record.lockoutUntil)) {
      loginAttemptsStore.delete(key)
    }
  }
}

export interface RateLimitCheckResult {
  allowed: boolean
  remainingAttempts: number
  retryAfterSeconds?: number
}

// Memeriksa status rate limit sebelum memproses login
export function checkLoginRateLimit(identifier: string): RateLimitCheckResult {
  cleanupExpiredRecords()
  const key = identifier.toLowerCase().trim()
  const record = loginAttemptsStore.get(key)
  const now = Date.now()

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS }
  }

  // Jika sedang dalam masa lockout
  if (record.lockoutUntil && record.lockoutUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockoutUntil - now) / 1000)
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    }
  }

  // Jika window waktu sudah lewat dan tidak sedang terkunci
  if (now - record.firstAttemptTime > ATTEMPT_WINDOW_MS) {
    loginAttemptsStore.delete(key)
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS }
  }

  const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts)
  return {
    allowed: record.attempts < MAX_FAILED_ATTEMPTS,
    remainingAttempts,
  }
}

// Mencatat satu kali kegagalan login
export function recordFailedLogin(identifier: string): {
  locked: boolean
  retryAfterSeconds?: number
} {
  const key = identifier.toLowerCase().trim()
  const now = Date.now()
  let record = loginAttemptsStore.get(key)

  if (!record || now - record.firstAttemptTime > ATTEMPT_WINDOW_MS) {
    record = {
      attempts: 1,
      firstAttemptTime: now,
      lockoutUntil: null,
    }
  } else {
    record.attempts += 1
  }

  // Kunci akun jika mencapai batas maksimum kegagalan
  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockoutUntil = now + LOCKOUT_DURATION_MS
    loginAttemptsStore.set(key, record)
    return {
      locked: true,
      retryAfterSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    }
  }

  loginAttemptsStore.set(key, record)
  return { locked: false }
}

// Reset catatan rate limit saat pengguna berhasil login
export function clearLoginRateLimit(identifier: string): void {
  const key = identifier.toLowerCase().trim()
  loginAttemptsStore.delete(key)
}
