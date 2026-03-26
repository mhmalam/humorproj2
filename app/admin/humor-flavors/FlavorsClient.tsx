'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createFlavor, updateFlavor, deleteFlavor } from '@/app/admin/_actions/flavor-actions'

export type Flavor = {
  id: string
  slug: string
  description: string | null
  created_datetime_utc?: string | null
}

const inp =
  'w-full bg-zinc-800/60 border border-zinc-700/60 text-zinc-100 placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all'
const txta = `${inp} resize-y min-h-[80px]`

const btnPrimary =
  'inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const btnGhost =
  'inline-flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-zinc-200 text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const btnDanger =
  'inline-flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

export default function FlavorsClient({ initialFlavors }: { initialFlavors: Flavor[] }) {
  const [isPending, startTransition] = useTransition()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [newSlug, setNewSlug] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editDesc, setEditDesc] = useState('')

  function startEdit(f: Flavor) {
    setEditingId(f.id)
    setEditSlug(f.slug)
    setEditDesc(f.description ?? '')
    setError(null)
    setIsCreating(false)
  }

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      try {
        await createFlavor(newSlug, newDesc || null)
        setIsCreating(false)
        setNewSlug('')
        setNewDesc('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create')
      }
    })
  }

  function handleUpdate(id: string) {
    setError(null)
    startTransition(async () => {
      try {
        await updateFlavor(id, editSlug, editDesc || null)
        setEditingId(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save')
      }
    })
  }

  function handleDelete(id: string, slug: string) {
    if (!confirm(`Delete flavor "${slug}"? This cannot be undone.`)) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteFlavor(id)
        if (editingId === id) setEditingId(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete')
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-2">
            Prompt Chain Tool
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Humor Flavors</h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            Create and manage the humor flavors used in your prompt chains.
          </p>
        </div>
        <button
          className={btnPrimary}
          disabled={isPending}
          onClick={() => { setIsCreating(true); setEditingId(null); setError(null) }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New flavor
        </button>
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
          <span className="text-sm text-red-400 flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-400 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Create form */}
      {isCreating && (
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: '#111113', border: '1px solid rgba(139,92,246,0.25)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">New flavor</h2>
            <div
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full text-violet-400"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              Draft
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Slug *</label>
              <input
                className={inp}
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="e.g. dry-wit, absurdist, punny"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
              <textarea
                className={txta}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Optional description of this humor style…"
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className={btnPrimary} disabled={isPending || !newSlug.trim()} onClick={handleCreate}>
              {isPending ? 'Creating…' : 'Create flavor'}
            </button>
            <button
              className={btnGhost}
              disabled={isPending}
              onClick={() => { setIsCreating(false); setNewSlug(''); setNewDesc('') }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* List header */}
        <div
          className="px-5 py-3.5 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-xs text-zinc-600 font-medium">
            {initialFlavors.length} flavor{initialFlavors.length !== 1 ? 's' : ''}
          </span>
          {isPending && (
            <span className="text-xs text-violet-400 animate-pulse flex items-center gap-1.5">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving
            </span>
          )}
        </div>

        {initialFlavors.length === 0 ? (
          <div className="px-5 py-20 text-center">
            <div
              className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <svg className="w-5 h-5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              </svg>
            </div>
            <div className="text-sm text-zinc-600">No flavors yet.</div>
            <div className="text-xs text-zinc-700 mt-0.5">Create your first one above.</div>
          </div>
        ) : (
          <div>
            {initialFlavors.map((f, i) =>
              editingId === f.id ? (
                <div
                  key={f.id}
                  className="p-5 space-y-4"
                  style={{
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                    background: 'rgba(139,92,246,0.04)',
                  }}
                >
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Editing
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">Slug *</label>
                      <input
                        className={inp}
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
                      <textarea
                        className={txta}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={btnPrimary}
                      disabled={isPending || !editSlug.trim()}
                      onClick={() => handleUpdate(f.id)}
                    >
                      {isPending ? 'Saving…' : 'Save changes'}
                    </button>
                    <button className={btnGhost} disabled={isPending} onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={f.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.015] transition-colors group"
                  style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                >
                  {/* Flavor info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold text-violet-400">{f.slug}</span>
                    </div>
                    {f.description && (
                      <div className="text-xs text-zinc-600 mt-0.5 leading-relaxed line-clamp-2 max-w-xl">
                        {f.description}
                      </div>
                    )}
                    <div className="text-[10px] text-zinc-800 mt-1 font-mono">{f.id}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/admin/humor-flavor-steps?flavorId=${f.id}`}
                      className="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-violet-400 rounded-lg transition-colors"
                    >
                      Steps
                    </Link>
                    <Link
                      href={`/admin/test-flavor?flavorId=${f.id}`}
                      className="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-violet-400 rounded-lg transition-colors"
                    >
                      Test
                    </Link>
                    <Link
                      href={`/admin/captions?flavorId=${f.id}`}
                      className="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-violet-400 rounded-lg transition-colors"
                    >
                      Captions
                    </Link>
                    <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.06)', margin: '0 4px' }} />
                    <button
                      className="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-200 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors disabled:opacity-40"
                      disabled={isPending}
                      onClick={() => startEdit(f)}
                    >
                      Edit
                    </button>
                    <button className={btnDanger} disabled={isPending} onClick={() => handleDelete(f.id, f.slug)}>
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
