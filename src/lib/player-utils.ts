export const PLAYING_POSITIONS = [
  'Keeper',
  'Bek',
  'Gelandang',
  'Penyerang',
] as const

export type PlayingPosition = (typeof PLAYING_POSITIONS)[number]

/**
 * Calculates displayed KU based on date of birth
 */
export function calculateKU(
  dateOfBirth: string | Date | null | undefined,
): string {
  if (!dateOfBirth) return '-'
  try {
    const dob =
      typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth
    if (isNaN(dob.getTime())) return '-'
    const year = dob.getFullYear()
    return `KU ${year}`
  } catch {
    return '-'
  }
}

/**
 * Calculates current age in years.
 */
export function calculateAge(
  dateOfBirth: string | Date | null | undefined,
): number | null {
  if (!dateOfBirth) return null
  try {
    const dob =
      typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth
    if (isNaN(dob.getTime())) return null
    const diffMs = Date.now() - dob.getTime()
    const ageDate = new Date(diffMs)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
  } catch {
    return null
  }
}

/**
 * Formats a Date object or YYYY-MM-DD string to Indonesian readable date.
 * Example: '2014-05-20' -> '20 Mei 2014'
 */
export function formatIndonesianDate(
  dateStr: string | Date | null | undefined,
): string {
  if (!dateStr) return '-'
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    if (isNaN(d.getTime())) return '-'
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d)
  } catch {
    return '-'
  }
}
