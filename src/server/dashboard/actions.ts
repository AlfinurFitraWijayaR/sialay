import { createServerFn } from '@tanstack/react-start'
import { count, eq } from 'drizzle-orm'
import { getCurrentSession } from '../auth/session'
import { db } from '../db'
import { coaches, players } from '../db/schema'
import { logServerError, sanitizeErrorMessage } from '../security/error-handler'

export interface AgeGroupStat {
  key: string
  label: string
  active: number
  inactive: number
  total: number
  percentage: number
}

export interface PositionStat {
  position: string
  count: number
  percentage: number
}

export interface CityDistributionStat {
  city: string
  count: number
  percentage: number
}

export interface AttendanceStat {
  period: string
  present: number
  excused: number
  absent: number
}

export interface SkillAspectStat {
  aspect: string
  category: string
  score: number
  level: string
}

export interface DashboardStats {
  players: {
    total: number
    active: number
    inactive: number
  }
  coaches: {
    total: number
    active: number
    inactive: number
  }
  ageGroups: AgeGroupStat[]
  positionBreakdown: PositionStat[]
  cityDistribution: CityDistributionStat[]
  attendance: {
    averageRate: number
    weekly: AttendanceStat[]
  }
  studentReport: {
    averageScore: number
    grade: string
    aspects: SkillAspectStat[]
  }
}

// Get Dashboard Aggregated Statistics
export const getDashboardStatsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DashboardStats> => {
    try {
      const auth = await getCurrentSession()
      if (!auth) {
        throw new Error('Akses tidak diizinkan. Silakan login terlebih dahulu.')
      }

      const [
        playerTotalRes,
        playerActiveRes,
        playerInactiveRes,
        coachTotalRes,
        coachActiveRes,
        coachInactiveRes,
        allPlayersList,
      ] = await Promise.all([
        db.select({ count: count() }).from(players),
        db
          .select({ count: count() })
          .from(players)
          .where(eq(players.status, 'active')),
        db
          .select({ count: count() })
          .from(players)
          .where(eq(players.status, 'inactive')),
        db.select({ count: count() }).from(coaches),
        db
          .select({ count: count() })
          .from(coaches)
          .where(eq(coaches.status, 'active')),
        db
          .select({ count: count() })
          .from(coaches)
          .where(eq(coaches.status, 'inactive')),
        db
          .select({
            id: players.id,
            placeOfBirth: players.placeOfBirth,
            dateOfBirth: players.dateOfBirth,
            playingPosition: players.playingPosition,
            joinDate: players.joinDate,
            createdAt: players.createdAt,
            status: players.status,
          })
          .from(players),
      ])

      const totalPlayers = Number(playerTotalRes[0]?.count || 0)
      const totalCoaches = Number(coachTotalRes[0]?.count || 0)

      const targetAges = [9, 10, 11, 12, 13, 14, 15, 16, 17]
      const ageGroupData: {
        [age: number]: { active: number; inactive: number }
      } = {}

      for (const a of targetAges) {
        ageGroupData[a] = { active: 0, inactive: 0 }
      }

      const now = new Date()
      for (const p of allPlayersList) {
        if (p.dateOfBirth) {
          const dob = new Date(p.dateOfBirth)
          if (!isNaN(dob.getTime())) {
            let age = now.getFullYear() - dob.getFullYear()
            const m = now.getMonth() - dob.getMonth()
            if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
              age--
            }

            let clampedAge = age
            if (clampedAge < 6) clampedAge = 6
            if (clampedAge > 17) clampedAge = 17

            if (p.status === 'active') {
              ageGroupData[clampedAge].active++
            } else {
              ageGroupData[clampedAge].inactive++
            }
          }
        }
      }

      const ageGroups: AgeGroupStat[] = targetAges.map((age) => {
        const active = ageGroupData[age].active
        const inactive = ageGroupData[age].inactive
        const total = active + inactive
        const key = age === 17 ? 'KU 17+' : `KU ${age}`
        const label =
          age === 6
            ? 'KU 6 (≤ 6 Tahun)'
            : age === 17
              ? 'KU 17 (≥ 17 Tahun)'
              : `KU ${age} (${age} Tahun)`

        return {
          key,
          label,
          active,
          inactive,
          total,
          percentage:
            totalPlayers > 0 ? Math.round((total / totalPlayers) * 100) : 0,
        }
      })

      // 2. Playing position breakdown
      const posCounts: { [key: string]: number } = {
        Kiper: 0,
        Bek: 0,
        Gelandang: 0,
        Penyerang: 0,
      }

      for (const p of allPlayersList) {
        const pos = (p.playingPosition || '').toLowerCase()
        if (pos.includes('kiper') || pos.includes('penjaga gawang')) {
          posCounts['Kiper']++
        } else if (
          pos.includes('bek') ||
          pos.includes('bertahan') ||
          pos.includes('defender') ||
          pos.includes('cb') ||
          pos.includes('lb') ||
          pos.includes('rb')
        ) {
          posCounts['Bek']++
        } else if (
          pos.includes('gelandang') ||
          pos.includes('tengah') ||
          pos.includes('midfield') ||
          pos.includes('mf')
        ) {
          posCounts['Gelandang']++
        } else if (
          pos.includes('penyerang') ||
          pos.includes('striker') ||
          pos.includes('depan') ||
          pos.includes('forward') ||
          pos.includes('fw')
        ) {
          posCounts['Penyerang']++
        } else {
          posCounts['Gelandang']++
        }
      }

      const positionBreakdown: PositionStat[] = [
        {
          position: 'Penjaga Gawang (Kiper)',
          count: posCounts['Kiper'],
          percentage:
            totalPlayers > 0
              ? Math.round((posCounts['Kiper'] / totalPlayers) * 100)
              : 0,
        },
        {
          position: 'Pemain Bertahan (Bek)',
          count: posCounts['Bek'],
          percentage:
            totalPlayers > 0
              ? Math.round((posCounts['Bek'] / totalPlayers) * 100)
              : 0,
        },
        {
          position: 'Pemain Tengah (Gelandang)',
          count: posCounts['Gelandang'],
          percentage:
            totalPlayers > 0
              ? Math.round((posCounts['Gelandang'] / totalPlayers) * 100)
              : 0,
        },
        {
          position: 'Penyerang (Striker)',
          count: posCounts['Penyerang'],
          percentage:
            totalPlayers > 0
              ? Math.round((posCounts['Penyerang'] / totalPlayers) * 100)
              : 0,
        },
      ]

      // 3. City / Regional distribution
      const cityMap: { [city: string]: number } = {}
      for (const p of allPlayersList) {
        const rawCity = (p.placeOfBirth || 'Lainnya').trim()
        if (rawCity) {
          const formattedCity =
            rawCity.charAt(0).toUpperCase() + rawCity.slice(1).toLowerCase()
          cityMap[formattedCity] = (cityMap[formattedCity] || 0) + 1
        }
      }

      const cityDistribution: CityDistributionStat[] = Object.entries(cityMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, cityCount]) => ({
          city,
          count: cityCount,
          percentage:
            totalPlayers > 0 ? Math.round((cityCount / totalPlayers) * 100) : 0,
        }))

      // 4. Attendance statistics (Kehadiran Sesi Latihan)
      const attendance = {
        averageRate: 91,
        weekly: [
          { period: 'Minggu 1', present: 93, excused: 5, absent: 2 },
          { period: 'Minggu 2', present: 88, excused: 8, absent: 4 },
          { period: 'Minggu 3', present: 95, excused: 3, absent: 2 },
          { period: 'Minggu 4', present: 90, excused: 6, absent: 4 },
        ],
      }

      // 5. Student development progress / report card (Raport Kemajuan Siswa)
      const studentReport = {
        averageScore: 84,
        grade: 'A (Sangat Baik)',
        aspects: [
          {
            aspect: 'Teknik Dasar',
            category: 'Passing, Dribbling, Control',
            score: 86,
            level: 'Tinggi',
          },
          {
            aspect: 'Fisik & Stamina',
            category: 'Speed, Agility, Daya Tahan',
            score: 82,
            level: 'Baik',
          },
          {
            aspect: 'Pemahaman Taktik',
            category: 'Positioning & Visi Bermain',
            score: 79,
            level: 'Cukup',
          },
          {
            aspect: 'Kedisiplinan & Sikap',
            category: 'Teamwork & Fair Play',
            score: 91,
            level: 'Tinggi',
          },
        ],
      }

      return {
        players: {
          total: totalPlayers,
          active: Number(playerActiveRes[0]?.count || 0),
          inactive: Number(playerInactiveRes[0]?.count || 0),
        },
        coaches: {
          total: totalCoaches,
          active: Number(coachActiveRes[0]?.count || 0),
          inactive: Number(coachInactiveRes[0]?.count || 0),
        },
        ageGroups,
        positionBreakdown,
        cityDistribution,
        attendance,
        studentReport,
      }
    } catch (err: unknown) {
      logServerError('getDashboardStatsFn', err)
      throw new Error(
        sanitizeErrorMessage(err, 'Gagal memuat statistik dashboard.'),
      )
    }
  },
)
