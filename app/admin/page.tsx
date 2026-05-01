import { createServiceClient } from '@/lib/supabase-service'
import Link from 'next/link'

function fmt(n: number | null | undefined) {
  if (typeof n !== 'number') return '—'
  return new Intl.NumberFormat('en-US').format(n)
}

export default async function AdminDashboardPage() {
  const service = createServiceClient()

  const [{ count: flavorCount }, { count: stepCount }, { count: captionCount }, { count: voteCount }] = await Promise.all([
    service.from('humor_flavors').select('id', { count: 'exact', head: true }),
    service.from('humor_flavor_steps').select('id', { count: 'exact', head: true }),
    service.from('captions').select('id', { count: 'exact', head: true }),
    service.from('caption_votes').select('id', { count: 'exact', head: true }),
  ])

  const { data: recentFlavors } = await service
    .from('humor_flavors')
    .select('id, slug, description')
    .order('id', { ascending: false })
    .limit(6)

  const actions = [
    {
      href: '/admin/humor-flavors',
      label: 'Humor Flavors',
      desc: 'Create, edit, and delete humor flavor definitions.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z" />
        </svg>
      ),
    },
    {
      href: '/admin/humor-flavor-steps',
      label: 'Flavor Steps',
      desc: 'Add, edit, and reorder prompt chain steps per flavor.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
    {
      href: '/admin/test-flavor',
      label: 'Test Flavor',
      desc: "Upload an image and run it through a flavor's full prompt chain.",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
        </svg>
      ),
    },
    {
      href: '/admin/captions',
      label: 'View Captions',
      desc: 'Browse all generated captions, filtered by humor flavor.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      ),
    },
    {
      href: '/admin/statistics',
      label: 'Statistics',
      desc: 'Caption ratings, vote breakdowns, and flavor usage metrics.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div>
        <div className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-3">
          AlmostCrackd
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50">
          Prompt Chain Tool
        </h1>
        <p className="mt-2 text-base text-zinc-500 max-w-lg">
          Build and test humor-flavored prompt chains. Run caption pipelines and explore generated output.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Humor Flavors', value: fmt(flavorCount), href: '/admin/humor-flavors', color: 'rgba(124,58,237,0.15)' },
          { label: 'Flavor Steps', value: fmt(stepCount), href: '/admin/humor-flavor-steps', color: 'rgba(79,70,229,0.15)' },
          { label: 'Captions Generated', value: fmt(captionCount), href: '/admin/captions', color: 'rgba(16,185,129,0.15)' },
          { label: 'Total Votes Cast', value: fmt(voteCount), href: '/admin/statistics', color: 'rgba(245,158,11,0.15)' },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-200 hover:scale-[1.01]"
            style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-60 blur-2xl pointer-events-none transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: s.color }}
            />
            <div className="relative">
              <div className="text-5xl font-bold text-zinc-50 tabular-nums">{s.value}</div>
              <div className="mt-1.5 text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
                {s.label}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Actions */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-4">
          Quick access
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:scale-[1.005]"
              style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at top left, rgba(124,58,237,0.07), transparent 65%)' }}
              />
              <div className="relative">
                <div
                  className="w-9 h-9 rounded-xl mb-4 flex items-center justify-center text-violet-400 transition-colors group-hover:text-violet-300"
                  style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
                >
                  {a.icon}
                </div>
                <div className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                  {a.label}
                </div>
                <div className="text-xs text-zinc-600 mt-1 leading-relaxed group-hover:text-zinc-500 transition-colors">
                  {a.desc}
                </div>
              </div>
              <div className="absolute top-4 right-4 text-zinc-700 group-hover:text-violet-500 transition-colors text-sm">
                →
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent flavors */}
      {recentFlavors && recentFlavors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-widest">
              Recent flavors
            </h2>
            <Link
              href="/admin/humor-flavors"
              className="text-xs text-violet-500 hover:text-violet-400 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {recentFlavors.map((f, i) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group"
                style={i > 0 ? { borderTop: '1px solid rgba(255,255,255,0.05)' } : undefined}
              >
                <div className="min-w-0">
                  <div className="text-sm font-mono font-medium text-violet-400">
                    {String(f.slug ?? '—')}
                  </div>
                  {f.description && (
                    <div className="text-xs text-zinc-600 mt-0.5 truncate max-w-sm">
                      {String(f.description)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/admin/humor-flavor-steps?flavorId=${f.id}`}
                    className="px-2.5 py-1 text-xs text-zinc-500 hover:text-violet-400 hover:bg-violet-500/[0.08] rounded-lg transition-colors"
                  >
                    Steps
                  </Link>
                  <Link
                    href={`/admin/test-flavor?flavorId=${f.id}`}
                    className="px-2.5 py-1 text-xs text-zinc-500 hover:text-violet-400 rounded-lg transition-colors"
                  >
                    Test
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
