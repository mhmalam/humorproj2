import { createServiceClient } from '@/lib/supabase-service'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function fmt(n: number | null | undefined) {
  if (typeof n !== 'number') return '—'
  return new Intl.NumberFormat('en-US').format(n)
}

function pct(part: number, total: number) {
  if (!total) return '0%'
  return `${Math.round((part / total) * 100)}%`
}

export default async function StatisticsPage() {
  const service = createServiceClient()

  const [
    { count: flavorCount },
    { count: stepCount },
    { count: captionCount },
    { count: imageCount },
  ] = await Promise.all([
    service.from('humor_flavors').select('id', { count: 'exact', head: true }),
    service.from('humor_flavor_steps').select('id', { count: 'exact', head: true }),
    service.from('captions').select('id', { count: 'exact', head: true }),
    service.from('images').select('id', { count: 'exact', head: true }),
  ])

  const { data: captionsPerFlavor } = await service
    .from('captions')
    .select('humor_flavor_id, humor_flavors(slug)')
    .not('humor_flavor_id', 'is', null)

  const { data: allVotes } = await service
    .from('caption_votes')
    .select('vote_type, created_at, caption_id')

  const { data: captionVoteSummary } = await service
    .from('caption_votes')
    .select('caption_id, vote_type, captions(content)')

  const { data: recentVotes } = await service
    .from('caption_votes')
    .select('vote_type, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const totalVotes = allVotes?.length ?? 0
  const upvotes = allVotes?.filter((v) => v.vote_type === 'upvote').length ?? 0
  const downvotes = allVotes?.filter((v) => v.vote_type === 'downvote').length ?? 0

  const flavorCaptionMap: Record<string, { slug: string; count: number }> = {}
  for (const row of captionsPerFlavor ?? []) {
    const flavorRow = row.humor_flavors as unknown as { slug: string } | null
    const slug = flavorRow?.slug ?? 'unknown'
    const id = row.humor_flavor_id as string
    if (!flavorCaptionMap[id]) flavorCaptionMap[id] = { slug, count: 0 }
    flavorCaptionMap[id].count++
  }
  const flavorCaptionList = Object.values(flavorCaptionMap).sort((a, b) => b.count - a.count)
  const maxFlavorCount = flavorCaptionList[0]?.count ?? 1

  const captionVoteMap: Record<string, { content: string; upvotes: number; downvotes: number }> = {}
  for (const row of captionVoteSummary ?? []) {
    const id = row.caption_id as string
    const captionRow = row.captions as unknown as { content: string } | null
    if (!captionVoteMap[id]) captionVoteMap[id] = { content: captionRow?.content ?? '(no text)', upvotes: 0, downvotes: 0 }
    if (row.vote_type === 'upvote') captionVoteMap[id].upvotes++
    else captionVoteMap[id].downvotes++
  }
  const topCaptions = Object.values(captionVoteMap)
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 10)

  const votesByDay: Record<string, { up: number; down: number }> = {}
  for (const v of recentVotes ?? []) {
    const day = v.created_at ? v.created_at.slice(0, 10) : 'unknown'
    if (!votesByDay[day]) votesByDay[day] = { up: 0, down: 0 }
    if (v.vote_type === 'upvote') votesByDay[day].up++
    else votesByDay[day].down++
  }
  const sortedDays = Object.entries(votesByDay).sort(([a], [b]) => a.localeCompare(b)).slice(-14)
  const maxDayVotes = Math.max(...sortedDays.map(([, d]) => d.up + d.down), 1)

  const statCards = [
    { label: 'Total Captions', value: fmt(captionCount), color: 'rgba(124,58,237,0.15)', href: '/admin/captions' },
    { label: 'Total Votes', value: fmt(totalVotes), color: 'rgba(16,185,129,0.15)', href: null },
    { label: 'Upvotes', value: fmt(upvotes), color: 'rgba(52,211,153,0.15)', href: null },
    { label: 'Downvotes', value: fmt(downvotes), color: 'rgba(239,68,68,0.15)', href: null },
    { label: 'Humor Flavors', value: fmt(flavorCount), color: 'rgba(79,70,229,0.15)', href: '/admin/humor-flavors' },
    { label: 'Images Processed', value: fmt(imageCount), color: 'rgba(245,158,11,0.15)', href: null },
  ]

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-3">
          Admin
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50">Statistics</h1>
        <p className="mt-2 text-base text-zinc-500 max-w-lg">
          Usage metrics and caption rating data across all humor flavors.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((s) => {
          const inner = (
            <div
              className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]"
              style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-60 blur-2xl pointer-events-none"
                style={{ background: s.color }}
              />
              <div className="relative">
                <div className="text-4xl font-bold text-zinc-50 tabular-nums">{s.value}</div>
                <div className="mt-1.5 text-xs text-zinc-500">{s.label}</div>
              </div>
            </div>
          )
          return s.href ? (
            <Link key={s.label} href={s.href}>{inner}</Link>
          ) : (
            <div key={s.label}>{inner}</div>
          )
        })}
      </div>

      {/* Vote breakdown */}
      {totalVotes > 0 && (
        <div
          className="rounded-2xl p-6"
          style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Vote Breakdown</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-emerald-400 font-medium">Upvotes</span>
                <span className="text-xs text-zinc-500">{fmt(upvotes)} · {pct(upvotes, totalVotes)}</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: pct(upvotes, totalVotes), background: 'rgba(52,211,153,0.7)' }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-red-400 font-medium">Downvotes</span>
                <span className="text-xs text-zinc-500">{fmt(downvotes)} · {pct(downvotes, totalVotes)}</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: pct(downvotes, totalVotes), background: 'rgba(239,68,68,0.6)' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voting trend by day */}
      {sortedDays.length > 0 && (
        <div
          className="rounded-2xl p-6"
          style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-sm font-semibold text-zinc-300 mb-6">Votes per Day (Last 14 days)</h2>
          <div className="flex items-end gap-2 h-32">
            {sortedDays.map(([day, counts]) => {
              const total = counts.up + counts.down
              const barH = Math.max((total / maxDayVotes) * 100, 4)
              const upH = total ? (counts.up / total) * barH : 0
              const downH = barH - upH
              const label = day.slice(5)
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="text-[10px] text-zinc-700 group-hover:text-zinc-400 transition-colors tabular-nums">{total}</div>
                  <div className="w-full flex flex-col justify-end rounded-sm overflow-hidden" style={{ height: '96px' }}>
                    <div style={{ height: `${downH}%`, background: 'rgba(239,68,68,0.45)', minHeight: downH > 0 ? '2px' : '0' }} />
                    <div style={{ height: `${upH}%`, background: 'rgba(52,211,153,0.55)', minHeight: upH > 0 ? '2px' : '0' }} />
                  </div>
                  <div className="text-[9px] text-zinc-700 whitespace-nowrap">{label}</div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(52,211,153,0.55)' }} />
              <span className="text-xs text-zinc-600">Upvotes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(239,68,68,0.45)' }} />
              <span className="text-xs text-zinc-600">Downvotes</span>
            </div>
          </div>
        </div>
      )}

      {/* Captions per flavor */}
      {flavorCaptionList.length > 0 && (
        <div
          className="rounded-2xl p-6"
          style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-sm font-semibold text-zinc-300 mb-5">Captions per Flavor</h2>
          <div className="space-y-3">
            {flavorCaptionList.map((row) => (
              <div key={row.slug} className="flex items-center gap-3">
                <div className="w-28 shrink-0 text-xs font-mono text-violet-400 truncate">{row.slug}</div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(row.count / maxFlavorCount) * 100}%`,
                      background: 'rgba(124,58,237,0.6)',
                      minWidth: '4px',
                    }}
                  />
                </div>
                <div className="w-10 text-right text-xs text-zinc-500 tabular-nums shrink-0">{row.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top-rated captions */}
      {topCaptions.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="px-5 py-3.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-sm font-semibold text-zinc-300">Top-Rated Captions</h2>
            <p className="text-xs text-zinc-600 mt-0.5">Ranked by upvotes</p>
          </div>
          <div>
            {topCaptions.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-4 px-5 py-3.5"
                style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
              >
                <div className="text-xs text-zinc-700 tabular-nums w-4 shrink-0 pt-0.5">{i + 1}</div>
                <div className="flex-1 text-sm text-zinc-300 leading-relaxed line-clamp-2">{c.content}</div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 text-xs text-emerald-500">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    {c.upvotes}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-red-500">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {c.downvotes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no votes yet */}
      {totalVotes === 0 && (
        <div
          className="rounded-2xl px-5 py-16 text-center"
          style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <svg className="w-6 h-6 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
          </div>
          <div className="text-sm text-zinc-600 font-medium">No vote data yet</div>
          <div className="text-xs text-zinc-700 mt-1">
            Once users start rating captions in the caption app, vote statistics will appear here.
          </div>
          <div className="mt-4 text-xs text-zinc-700">
            Caption count: <span className="text-zinc-500 font-medium">{fmt(captionCount)}</span>
            {' · '}
            Flavor count: <span className="text-zinc-500 font-medium">{fmt(flavorCount)}</span>
          </div>
        </div>
      )}

      {/* Summary table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="px-5 py-3.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-sm font-semibold text-zinc-300">Summary Table</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">Metric</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Humor Flavors', value: fmt(flavorCount) },
              { label: 'Flavor Steps (total)', value: fmt(stepCount) },
              { label: 'Images Processed', value: fmt(imageCount) },
              { label: 'Captions Generated', value: fmt(captionCount) },
              { label: 'Total Votes Cast', value: fmt(totalVotes) },
              { label: 'Upvotes', value: fmt(upvotes) },
              { label: 'Downvotes', value: fmt(downvotes) },
              { label: 'Upvote Rate', value: totalVotes ? pct(upvotes, totalVotes) : '—' },
              { label: 'Flavors with Captions', value: fmt(flavorCaptionList.length) },
            ].map((row, i) => (
              <tr
                key={row.label}
                style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
                className="hover:bg-white/[0.015] transition-colors"
              >
                <td className="px-5 py-3 text-zinc-400">{row.label}</td>
                <td className="px-5 py-3 text-right font-mono font-medium text-zinc-200 tabular-nums">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
