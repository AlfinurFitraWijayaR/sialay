// Sanitasi pesan error agar aman ditampilkan ke pengguna / browser client
export function sanitizeErrorMessage(
  error: unknown,
  fallbackMessage = 'Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi.',
): string {
  if (error instanceof Error) {
    const msg = error.message

    // Pola-pola sensitif yang WAJIB dimasking jika terdeteksi
    const isSensitive =
      /select\s+|insert\s+into|update\s+|delete\s+from|from\s+["'`]?\w+["'`]?/i.test(
        msg,
      ) ||
      /postgres|psql|drizzle|sqlstate|relation\s+|column\s+|syntax error/i.test(
        msg,
      ) ||
      /password|secret|token|credential|connection\s+refused|econnrefused/i.test(
        msg,
      ) ||
      /\\Users\\|\/home\/|\/var\/|\/etc\/|\/tmp\//i.test(msg)

    if (isSensitive) {
      // Selalu sembunyikan detail query / stack internal pada respon client
      return fallbackMessage
    }

    // Jika pesan adalah pesan validasi bisnis buatan aplikasi sendiri yang aman
    const isUserFacingValidation =
      /wajib diisi|tidak valid|melebihi batas|antara \d+|format|akses tidak diizinkan|terlalu banyak/i.test(
        msg,
      )

    if (isUserFacingValidation) {
      return msg
    }
  }

  // Jika di mode production, gunakan fallback aman
  if (process.env.NODE_ENV === 'production') {
    return fallbackMessage
  }

  // Pada development, jika bukan pesan sensitif, tampilkan pesan aslinya untuk mempermudah debugging
  return error instanceof Error ? error.message : fallbackMessage
}

// Log error internal ke server console tanpa mengeksposnya ke client
export function logServerError(context: string, error: unknown): void {
  const timestamp = new Date().toISOString()
  if (error instanceof Error) {
    console.error(`[${timestamp}] [SERVER ERROR] ${context}:`, {
      message: error.message,
      stack: error.stack,
    })
  } else {
    console.error(`[${timestamp}] [SERVER ERROR] ${context}:`, error)
  }
}
