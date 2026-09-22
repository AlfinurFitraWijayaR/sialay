import { useState } from 'react'
import type { DashboardStats } from '../../server/dashboard/actions'

interface DashboardChartsProps {
  stats: DashboardStats
}

export function DashboardCharts({ stats }: DashboardChartsProps) {
  const [hoveredKuIndex, setHoveredKuIndex] = useState<number | null>(null)
  const [hoveredDocIndex, setHoveredDocIndex] = useState<number | null>(null)

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
  const posColors = ['#FCAD38', '#EB7F31', '#E45742', '#972828']

  const donutRadius = 38
  const donutCircumference = 2 * Math.PI * donutRadius
  let cumulativeOffset = 0

  // 3. Data Grafik Administrasi
  const adminDocs = stats.administrations.documents
  const adminChartWidth = 480
  const adminChartHeight = 160
  const adminPadLeft = 28
  const adminPadRight = 14
  const adminPadTop = 18
  const adminPadBottom = 30
  const adminPlotWidth = adminChartWidth - adminPadLeft - adminPadRight
  const adminPlotHeight = adminChartHeight - adminPadTop - adminPadBottom
  const adminStepX = adminPlotWidth / (adminDocs.length || 1)
  const adminBarWidth = Math.min(22, adminStepX * 0.28)

  const getAdminY = (val: number) => {
    return adminPadTop + adminPlotHeight - (val / 100) * adminPlotHeight
  }
  const adminYTicks = [0, 50, 100]

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
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#972828]" />
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

                      {/* Bar Non-Aktif (#972828) */}
                      <rect
                        x={colCenter + 1}
                        y={
                          ku.inactive > 0
                            ? inactiveY
                            : kuPadTop + kuPlotHeight - 2
                        }
                        width={kuBarWidth}
                        height={ku.inactive > 0 ? inactiveH : 2}
                        fill="#972828"
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
                    {ageGroups[hoveredKuIndex].label}
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
                  Distribusi Komposisi Squad
                </h2>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Distribusi peran dan formasi siswa di lapangan
                </p>
              </div>
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
        {/* Card 3: Grafik Administrasi Siswa */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f1f5f9]">
              <div>
                <h2 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                  Grafik Administrasi Siswa
                </h2>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Kelengkapan 4 berkas wajib pendaftaran
                </p>
              </div>

              {/* Legend Administrasi */}
              <div className="flex items-center gap-3 text-xs font-medium shrink-0">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#FBC02D]" />
                  <span className="text-[#0f172a]">Ada</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#972828]" />
                  <span className="text-[#0f172a]">Belum Ada</span>
                </div>
              </div>
            </div>

            {/* SVG Administration Grouped Bar Chart */}
            <div className="relative mt-3">
              <svg
                viewBox={`0 0 ${adminChartWidth} ${adminChartHeight}`}
                className="w-full h-auto overflow-visible select-none"
                role="img"
                aria-label="Grafik kelengkapan berkas administrasi siswa"
              >
                {adminYTicks.map((tick) => {
                  const y = getAdminY(tick)
                  return (
                    <g key={`adminy-${tick}`}>
                      <line
                        x1={adminPadLeft}
                        y1={y}
                        x2={adminChartWidth - adminPadRight}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                      />
                      <text
                        x={adminPadLeft - 6}
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

                {adminDocs.map((doc, idx) => {
                  const colCenter =
                    adminPadLeft + idx * adminStepX + adminStepX / 2
                  const isHovered = hoveredDocIndex === idx

                  const totalPlayers = stats.administrations.total
                  const adaPct = doc.percentage
                  const belumPct =
                    totalPlayers > 0
                      ? Math.round((doc.missing / totalPlayers) * 100)
                      : 0

                  const adaH =
                    totalPlayers > 0 && doc.collected > 0
                      ? (adaPct / 100) * adminPlotHeight
                      : 2
                  const belumH =
                    totalPlayers > 0 && doc.missing > 0
                      ? (belumPct / 100) * adminPlotHeight
                      : 2

                  const adaY = adminPadTop + adminPlotHeight - adaH
                  const belumY = adminPadTop + adminPlotHeight - belumH

                  return (
                    <g
                      key={doc.key}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredDocIndex(idx)}
                      onMouseLeave={() => setHoveredDocIndex(null)}
                    >
                      {isHovered && (
                        <rect
                          x={adminPadLeft + idx * adminStepX + 4}
                          y={adminPadTop}
                          width={adminStepX - 8}
                          height={adminPlotHeight}
                          fill="#FBC02D"
                          fillOpacity={0.08}
                          rx={4}
                        />
                      )}

                      {/* Ada Bar (#FBC02D) */}
                      <rect
                        x={colCenter - adminBarWidth - 2}
                        y={adaY}
                        width={adminBarWidth}
                        height={adaH}
                        fill="#FBC02D"
                        rx={3}
                        className="transition-all duration-200"
                      />

                      {/* Belum Ada Bar (#972828) */}
                      <rect
                        x={colCenter + 2}
                        y={belumY}
                        width={adminBarWidth}
                        height={belumH}
                        fill="#972828"
                        rx={3}
                        className="transition-all duration-200"
                      />

                      {/* Label Dokumen */}
                      <text
                        x={colCenter}
                        y={adminChartHeight - 12}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight={isHovered ? 'bold' : '600'}
                        fill={isHovered ? '#0f172a' : '#334155'}
                      >
                        {doc.label}
                      </text>
                      <text
                        x={colCenter}
                        y={adminChartHeight - 1}
                        textAnchor="middle"
                        fontSize="8.5"
                        fill="#78350F"
                        fontWeight="600"
                      >
                        {doc.collected}/{totalPlayers} Ada
                      </text>
                    </g>
                  )
                })}
              </svg>

              {/* Tooltip Administrasi */}
              {hoveredDocIndex !== null && adminDocs[hoveredDocIndex] && (
                <div
                  className="absolute top-0 right-0 bg-white/95 backdrop-blur-xs border border-[#e2e8f0] rounded-lg shadow-sm px-2.5 py-1.5 text-xs pointer-events-none flex items-center gap-2.5 z-10"
                  aria-live="polite"
                >
                  <div className="font-semibold text-[#0f172a]">
                    {adminDocs[hoveredDocIndex].label}
                  </div>
                  <div className="text-[#78350F]">
                    Ada:{' '}
                    <strong>
                      {adminDocs[hoveredDocIndex].collected} (
                      {adminDocs[hoveredDocIndex].percentage}%)
                    </strong>
                  </div>
                  <div className="text-[#991B1B]">
                    Belum Ada:{' '}
                    <strong>
                      {adminDocs[hoveredDocIndex].missing} (
                      {stats.administrations.total > 0
                        ? Math.round(
                            (adminDocs[hoveredDocIndex].missing /
                              stats.administrations.total) *
                              100,
                          )
                        : 0}
                      %)
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
            <span className="text-[#64748b]">
              Siswa Berkas Lengkap:{' '}
              <strong className="text-[#0f172a]">
                {stats.administrations.complete}
              </strong>{' '}
              dari {stats.administrations.total} Siswa
            </span>
          </div>
        </div>

        {/* Card 4: Raport Kemajuan Siswa */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div>
                <h2 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                  Raport Kemajuan Siswa (MASIH DEMO)
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
                const barColor = idx % 2 === 0 ? 'bg-[#FBC02D]' : 'bg-[#972828]'
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
