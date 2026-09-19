import { useState } from 'react'
import type { DashboardStats } from '../../server/dashboard/actions'

interface DashboardChartsProps {
  stats: DashboardStats
}

export function DashboardCharts({ stats }: DashboardChartsProps) {
  const [hoveredKuIndex, setHoveredKuIndex] = useState<number | null>(null)
  const [hoveredWeekIndex, setHoveredWeekIndex] = useState<number | null>(null)

  // 1. Data Kelompok Usia (KU)
  const ageGroups = stats.ageGroups
  const maxKuVal = Math.max(
    3,
    ...ageGroups.map((ku) => Math.max(ku.active, ku.inactive)),
  )

  const kuChartWidth = 560
  const kuChartHeight = 175
  const kuPadLeft = 26
  const kuPadRight = 12
  const kuPadTop = 20
  const kuPadBottom = 34
  const kuPlotWidth = kuChartWidth - kuPadLeft - kuPadRight
  const kuPlotHeight = kuChartHeight - kuPadTop - kuPadBottom
  const kuStepX = kuPlotWidth / (ageGroups.length || 1)
  const kuBarWidth = Math.min(8, kuStepX * 0.22)

  const getKuY = (val: number) => {
    return kuPadTop + kuPlotHeight - (val / maxKuVal) * kuPlotHeight
  }
  const kuYTicks = [0, Math.ceil(maxKuVal / 2), maxKuVal]

  // 2. Data Komposisi Squad (Posisi Lapangan)
  const positions = stats.positionBreakdown
  const totalPosPlayers = positions.reduce((acc, p) => acc + p.count, 0)
  const posColors = ['#FBC02D', '#C62828', '#E5A800', '#991B1B']

  const donutRadius = 38
  const donutCircumference = 2 * Math.PI * donutRadius
  let cumulativeOffset = 0

  const activeCoaches = stats.coaches.active
  const activePlayers = stats.players.active
  const playerPerCoachRatio =
    activeCoaches > 0
      ? (activePlayers / activeCoaches).toFixed(1)
      : activePlayers.toString()

  // 3. Data Grafik Absensi
  const attendanceWeekly = stats.attendance.weekly
  const attChartWidth = 480
  const attChartHeight = 160
  const attPadLeft = 28
  const attPadRight = 14
  const attPadTop = 18
  const attPadBottom = 30
  const attPlotWidth = attChartWidth - attPadLeft - attPadRight
  const attPlotHeight = attChartHeight - attPadTop - attPadBottom
  const attStepX = attPlotWidth / (attendanceWeekly.length || 1)
  const attBarWidth = Math.min(14, attStepX * 0.22)

  const getAttY = (val: number) => {
    return attPadTop + attPlotHeight - (val / 100) * attPlotHeight
  }
  const attYTicks = [0, 50, 100]

  // 4. Data Raport Kemajuan Siswa
  const reportAspects = stats.studentReport.aspects

  return (
    <div className="space-y-5">
      {/* Baris 1: Distribusi KU & Komposisi Squad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Distribusi Kelompok Usia (KU) */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f1f5f9]">
              <div>
                <h2 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#FBC02D]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Distribusi Kelompok Usia (KU)
                </h2>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Perbandingan siswa aktif & tidak aktif per kategori usia
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs font-medium shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#FBC02D]" />
                  <span className="text-[#0f172a]">Aktif</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#C62828]" />
                  <span className="text-[#0f172a]">Non-Aktif</span>
                </div>
              </div>
            </div>

            {/* SVG KU Grouped Bar Chart */}
            <div className="relative mt-3">
              <svg
                viewBox={`0 0 ${kuChartWidth} ${kuChartHeight}`}
                className="w-full h-auto overflow-visible select-none"
                role="img"
                aria-label="Grafik perbandingan siswa per kelompok usia"
              >
                {kuYTicks.map((tick) => {
                  const y = getKuY(tick)
                  return (
                    <g key={`kuy-${tick}`}>
                      <line
                        x1={kuPadLeft}
                        y1={y}
                        x2={kuChartWidth - kuPadRight}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                      />
                      <text
                        x={kuPadLeft - 6}
                        y={y + 3}
                        textAnchor="end"
                        fontSize="9"
                        fill="#94a3b8"
                        className="font-mono"
                      >
                        {tick}
                      </text>
                    </g>
                  )
                })}

                {ageGroups.map((ku, idx) => {
                  const colCenter = kuPadLeft + idx * kuStepX + kuStepX / 2
                  const isHovered = hoveredKuIndex === idx

                  const activeH = (ku.active / maxKuVal) * kuPlotHeight
                  const inactiveH = (ku.inactive / maxKuVal) * kuPlotHeight

                  const activeY = kuPadTop + kuPlotHeight - activeH
                  const inactiveY = kuPadTop + kuPlotHeight - inactiveH

                  return (
                    <g
                      key={ku.key}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredKuIndex(idx)}
                      onMouseLeave={() => setHoveredKuIndex(null)}
                    >
                      {isHovered && (
                        <rect
                          x={kuPadLeft + idx * kuStepX + 2}
                          y={kuPadTop}
                          width={kuStepX - 4}
                          height={kuPlotHeight}
                          fill="#FBC02D"
                          fillOpacity={0.08}
                          rx={4}
                        />
                      )}

                      {/* Bar Aktif (#FBC02D) */}
                      <rect
                        x={colCenter - kuBarWidth - 1}
                        y={
                          ku.active > 0 ? activeY : kuPadTop + kuPlotHeight - 2
                        }
                        width={kuBarWidth}
                        height={ku.active > 0 ? activeH : 2}
                        fill="#FBC02D"
                        rx={2}
                        className="transition-all duration-200"
                      />

                      {/* Bar Non-Aktif (#C62828) */}
                      <rect
                        x={colCenter + 1}
                        y={
                          ku.inactive > 0
                            ? inactiveY
                            : kuPadTop + kuPlotHeight - 2
                        }
                        width={kuBarWidth}
                        height={ku.inactive > 0 ? inactiveH : 2}
                        fill="#C62828"
                        rx={2}
                        className="transition-all duration-200"
                      />

                      <text
                        x={colCenter}
                        y={kuChartHeight - 13}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight={isHovered ? 'bold' : '600'}
                        fill={isHovered ? '#0f172a' : '#334155'}
                      >
                        {ku.key}
                      </text>
                      <text
                        x={colCenter}
                        y={kuChartHeight - 2}
                        textAnchor="middle"
                        fontSize="8"
                        fill={ku.total > 0 ? '#0f172a' : '#94a3b8'}
                        fontWeight={ku.total > 0 ? '600' : 'normal'}
                      ></text>
                    </g>
                  )
                })}
              </svg>

              {/* Tooltip Overlay */}
              {hoveredKuIndex !== null && ageGroups[hoveredKuIndex] && (
                <div
                  className="absolute top-0 right-0 bg-white/95 backdrop-blur-xs border border-[#e2e8f0] rounded-lg shadow-sm px-2.5 py-1.5 text-xs pointer-events-none flex items-center gap-2.5 z-10"
                  aria-live="polite"
                >
                  <div className="font-semibold text-[#0f172a]">
                    {ageGroups[hoveredKuIndex].key}
                  </div>
                  <div className="text-[#78350F] font-medium">
                    Aktif: <strong>{ageGroups[hoveredKuIndex].active}</strong>
                  </div>
                  <div className="text-[#991B1B] font-medium">
                    Non-Aktif:{' '}
                    <strong>{ageGroups[hoveredKuIndex].inactive}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Komposisi Squad (Posisi Lapangan) */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div>
                <h2 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#C62828]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Distribusi Komposisi Siswa
                </h2>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Distribusi peran dan formasi siswa di lapangan
                </p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF9C3] text-[#78350F] border border-[#FDE047]">
                Formasi Skuad
              </span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center gap-5">
              {/* Donut Chart */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg
                  viewBox="0 0 100 100"
                  className="w-28 h-28 -rotate-90"
                  role="img"
                  aria-label="Diagram komposisi posisi bermain pemain"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={donutRadius}
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="12"
                  />
                  {totalPosPlayers > 0 ? (
                    positions.map((p, idx) => {
                      const strokeDash =
                        (p.count / totalPosPlayers) * donutCircumference
                      const strokeOffset = -cumulativeOffset
                      cumulativeOffset += strokeDash
                      return (
                        <circle
                          key={p.position}
                          cx="50"
                          cy="50"
                          r={donutRadius}
                          fill="none"
                          stroke={posColors[idx % posColors.length]}
                          strokeWidth="12"
                          strokeDasharray={`${strokeDash} ${donutCircumference}`}
                          strokeDashoffset={strokeOffset}
                          className="transition-all duration-300"
                        />
                      )
                    })
                  ) : (
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="12"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-base font-extrabold text-[#0f172a] leading-tight">
                    {stats.players.total}
                  </span>
                  <span className="text-[10px] text-[#64748b]">Pemain</span>
                </div>
              </div>

              {/* Positions Legend & Percentages */}
              <div className="flex-1 w-full space-y-1.5">
                {positions.map((p, idx) => (
                  <div
                    key={p.position}
                    className="flex items-center justify-between text-xs py-0.5"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{
                          backgroundColor: posColors[idx % posColors.length],
                        }}
                      />
                      <span className="font-medium text-[#0f172a] truncate">
                        {p.position}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <span className="font-bold text-[#0f172a]">
                        {p.count}
                      </span>
                      <span className="text-[#64748b]">({p.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Baris 2: Grafik Absensi & Raport Kemajuan Siswa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 3: Grafik Absensi Latihan */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f1f5f9]">
              <div>
                <h2 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#FBC02D]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Grafik Absensi Latihan
                </h2>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Tingkat kehadiran siswa pada sesi latihan mingguan
                </p>
              </div>

              {/* Legend Absensi */}
              <div className="flex items-center gap-3 text-xs font-medium shrink-0">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#FBC02D]" />
                  <span className="text-[#0f172a]">Hadir</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#E5A800]" />
                  <span className="text-[#0f172a]">Izin</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#C62828]" />
                  <span className="text-[#0f172a]">Alfa</span>
                </div>
              </div>
            </div>

            {/* SVG Attendance Grouped Bar Chart */}
            <div className="relative mt-3">
              <svg
                viewBox={`0 0 ${attChartWidth} ${attChartHeight}`}
                className="w-full h-auto overflow-visible select-none"
                role="img"
                aria-label="Grafik kehadiran latihan siswa mingguan"
              >
                {attYTicks.map((tick) => {
                  const y = getAttY(tick)
                  return (
                    <g key={`atty-${tick}`}>
                      <line
                        x1={attPadLeft}
                        y1={y}
                        x2={attChartWidth - attPadRight}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                      />
                      <text
                        x={attPadLeft - 6}
                        y={y + 3}
                        textAnchor="end"
                        fontSize="9"
                        fill="#94a3b8"
                        className="font-mono"
                      >
                        {tick}%
                      </text>
                    </g>
                  )
                })}

                {attendanceWeekly.map((att, idx) => {
                  const colCenter = attPadLeft + idx * attStepX + attStepX / 2
                  const isHovered = hoveredWeekIndex === idx

                  const presentH = (att.present / 100) * attPlotHeight
                  const excusedH = (att.excused / 100) * attPlotHeight
                  const absentH = (att.absent / 100) * attPlotHeight

                  const presentY = attPadTop + attPlotHeight - presentH
                  const excusedY = attPadTop + attPlotHeight - excusedH
                  const absentY = attPadTop + attPlotHeight - absentH

                  return (
                    <g
                      key={att.period}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredWeekIndex(idx)}
                      onMouseLeave={() => setHoveredWeekIndex(null)}
                    >
                      {isHovered && (
                        <rect
                          x={attPadLeft + idx * attStepX + 4}
                          y={attPadTop}
                          width={attStepX - 8}
                          height={attPlotHeight}
                          fill="#FBC02D"
                          fillOpacity={0.08}
                          rx={4}
                        />
                      )}

                      {/* Hadir Bar (#FBC02D) */}
                      <rect
                        x={colCenter - attBarWidth * 1.5 - 2}
                        y={presentY}
                        width={attBarWidth}
                        height={presentH}
                        fill="#FBC02D"
                        rx={2.5}
                        className="transition-all duration-200"
                      />

                      {/* Izin Bar (#E5A800) */}
                      <rect
                        x={colCenter - attBarWidth / 2}
                        y={excusedY}
                        width={attBarWidth}
                        height={excusedH}
                        fill="#E5A800"
                        rx={2.5}
                        className="transition-all duration-200"
                      />

                      {/* Alfa Bar (#C62828) */}
                      <rect
                        x={colCenter + attBarWidth / 2 + 2}
                        y={absentY}
                        width={attBarWidth}
                        height={absentH}
                        fill="#C62828"
                        rx={2.5}
                        className="transition-all duration-200"
                      />

                      <text
                        x={colCenter}
                        y={attChartHeight - 12}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight={isHovered ? 'bold' : '600'}
                        fill={isHovered ? '#0f172a' : '#334155'}
                      >
                        {att.period}
                      </text>
                      <text
                        x={colCenter}
                        y={attChartHeight - 1}
                        textAnchor="middle"
                        fontSize="8.5"
                        fill="#16a34a"
                        fontWeight="600"
                      >
                        {att.present}% hadir
                      </text>
                    </g>
                  )
                })}
              </svg>

              {/* Tooltip Absensi */}
              {hoveredWeekIndex !== null &&
                attendanceWeekly[hoveredWeekIndex] && (
                  <div
                    className="absolute top-0 right-0 bg-white/95 backdrop-blur-xs border border-[#e2e8f0] rounded-lg shadow-sm px-2.5 py-1.5 text-xs pointer-events-none flex items-center gap-2.5 z-10"
                    aria-live="polite"
                  >
                    <div className="font-semibold text-[#0f172a]">
                      {attendanceWeekly[hoveredWeekIndex].period}
                    </div>
                    <div className="text-[#78350F]">
                      Hadir:{' '}
                      <strong>
                        {attendanceWeekly[hoveredWeekIndex].present}%
                      </strong>
                    </div>
                    <div className="text-[#B45309]">
                      Izin:{' '}
                      <strong>
                        {attendanceWeekly[hoveredWeekIndex].excused}%
                      </strong>
                    </div>
                    <div className="text-[#991B1B]">
                      Alfa:{' '}
                      <strong>
                        {attendanceWeekly[hoveredWeekIndex].absent}%
                      </strong>
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
            <span className="text-[#64748b]">
              Rata-rata Kehadiran Bulan Ini
            </span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {stats.attendance.averageRate}% (Disiplin Tinggi)
            </span>
          </div>
        </div>

        {/* Card 4: Raport Kemajuan Siswa */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div>
                <h2 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#C62828]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Raport Kemajuan Siswa
                </h2>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Rata-rata evaluasi 4 pilar kemampuan kurikulum SSB
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-[#0f172a] bg-[#FEF9C3] px-2 py-0.5 rounded border border-[#FDE047]">
                  Predikat {stats.studentReport.grade}
                </span>
              </div>
            </div>

            {/* Aspects Progress Bars */}
            <div className="mt-3.5 space-y-2.5">
              {reportAspects.map((asp, idx) => {
                const barColor = idx % 2 === 0 ? 'bg-[#FBC02D]' : 'bg-[#C62828]'
                const badgeColor =
                  idx % 2 === 0
                    ? 'text-[#78350F] bg-[#FEF9C3]'
                    : 'text-[#991B1B] bg-[#FEE2E2]'

                return (
                  <div key={asp.aspect} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-[#0f172a]">
                          {asp.aspect}
                        </span>
                        <span className="text-[11px] text-[#64748b] ml-1.5 hidden sm:inline">
                          ({asp.category})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#0f172a]">
                          {asp.score}/100
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${badgeColor}`}
                        >
                          {asp.level}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-300`}
                        style={{ width: `${asp.score}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
            <span className="text-[#64748b]">Skor Rata-rata Akademi</span>
            <span className="font-extrabold text-sm text-[#0f172a]">
              {stats.studentReport.averageScore} / 100
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
