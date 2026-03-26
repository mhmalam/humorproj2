'use client'

import { useRouter } from 'next/navigation'

type Flavor = { id: string; slug: string }

export default function CaptionFlavorSelector({
  flavors,
  selectedFlavorId,
}: {
  flavors: Flavor[]
  selectedFlavorId: string | null
}) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-3">
      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider shrink-0">
        Flavor
      </label>
      <select
        className="flex-1 bg-zinc-800/60 border border-zinc-700/60 text-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all max-w-sm"
        value={selectedFlavorId ?? ''}
        onChange={(e) => {
          const v = e.target.value
          router.push(v ? `/admin/captions?flavorId=${v}` : '/admin/captions')
        }}
      >
        <option value="">All flavors</option>
        {flavors.map((f) => (
          <option key={f.id} value={f.id}>
            {f.slug}
          </option>
        ))}
      </select>
    </div>
  )
}
