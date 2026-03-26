import { createServiceClient } from '@/lib/supabase-service'
import CaptionFlavorSelector from './CaptionFlavorSelector'

// Always fetch fresh — prevents SSR HTML / RSC payload cache mismatch
export const dynamic = 'force-dynamic'

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function CaptionsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const flavorId = typeof params.flavorId === 'string' ? params.flavorId : null

  const service = createServiceClient()

  const { data: flavors } = await service
    .from('humor_flavors')
    .select('id, slug')
    .order('slug')

  type Caption = {
    id: string
    content: string | null
    image_id: string | null
    humor_flavor_id: string | null
    created_datetime_utc: string | null
  }

  let captionsQuery = service
    .from('captions')
    .select('id, content, image_id, humor_flavor_id, created_datetime_utc')
    .order('created_datetime_utc', { ascending: false })
    .limit(120)

  if (flavorId) {
    captionsQuery = captionsQuery.eq('humor_flavor_id', flavorId)
  }

  const { data: captions, error } = await captionsQuery

  const imageUrlById: Record<string, string> = {}

  if (captions && captions.length > 0) {
    const imageIds = [
      ...new Set((captions as Caption[]).map((c) => c.image_id).filter(Boolean)),
    ] as string[]

    if (imageIds.length > 0) {
      const { data: images } = await service
        .from('images')
        .select('*')
        .in('id', imageIds)

      if (images && images.length > 0) {
        // Log column names once so we can confirm the correct field
        const cols = Object.keys(images[0] as object)
        console.log('[captions] images row columns:', cols)

        for (const img of images as Record<string, unknown>[]) {
          const id = img.id as string
          // Try every plausible URL column name in priority order
          const url =
            (img.cdn_url as string | null) ??
            (img.url as string | null) ??
            (img.image_url as string | null) ??
            (img.public_url as string | null) ??
            (img.storage_url as string | null) ??
            (img.file_url as string | null) ??
            null
          if (id && url) imageUrlById[id] = url
        }
      }
    }
  }

  const selectedFlavor = (flavors ?? []).find((f) => f.id === flavorId)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-2">
            Prompt Chain Tool
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">View Captions</h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            {selectedFlavor
              ? <>Captions generated with <span className="font-mono text-violet-400">{selectedFlavor.slug}</span>.</>
              : 'Browse all generated captions across every humor flavor.'}
          </p>
        </div>
        {captions && captions.length > 0 && (
          <div
            className="shrink-0 text-sm font-medium text-zinc-500 rounded-xl px-3 py-1.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {captions.length} caption{captions.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Filter */}
      <div
        className="rounded-2xl px-5 py-4"
        style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <CaptionFlavorSelector flavors={flavors ?? []} selectedFlavorId={flavorId} />
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
          <span className="text-sm text-red-400">{error.message}</span>
        </div>
      )}

      {/* Grid */}
      {!captions || captions.length === 0 ? (
        <div
          className="rounded-2xl px-5 py-24 text-center"
          style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <svg className="w-6 h-6 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <div className="text-sm text-zinc-600 font-medium">No captions yet</div>
          <div className="text-xs text-zinc-700 mt-1">
            {flavorId ? 'No captions have been generated for this flavor.' : 'Run the pipeline to generate your first captions.'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {(captions as Caption[]).map((c) => {
            const imgUrl = c.image_id ? (imageUrlById[c.image_id] ?? null) : null
            return (
              <div
                key={c.id}
                className="group rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]"
                style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Image */}
                {imgUrl ? (
                  <a href={imgUrl} target="_blank" rel="noreferrer" className="block relative">
                    <div className="aspect-square overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-400"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium backdrop-blur-sm">
                        Open ↗
                      </span>
                    </div>
                  </a>
                ) : (
                  <div
                    className="aspect-square flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <svg className="w-8 h-8 text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                )}

                {/* Caption text + meta */}
                <div className="p-4">
                  <p className="text-sm text-zinc-200 leading-relaxed line-clamp-4">
                    {c.content ?? (
                      <span className="text-zinc-700 italic">No caption text</span>
                    )}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {c.created_datetime_utc && (
                      <span className="text-[11px] text-zinc-600">
                        {new Date(c.created_datetime_utc).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    <span
                      className="text-[10px] text-zinc-800 font-mono truncate ml-auto max-w-[100px]"
                      title={c.id}
                    >
                      {c.id.slice(0, 8)}…
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
