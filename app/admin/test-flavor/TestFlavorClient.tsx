'use client'

import { useState } from 'react'
import {
  getPresignedUrl,
  registerImage,
  generateCaptions,
  getGeneratedCaptions,
} from '@/app/admin/_actions/pipeline-actions'

export type Flavor = { id: string; slug: string }

const SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic']

type StepStatus = 'idle' | 'running' | 'done' | 'error'
type PipelineStep = { id: string; label: string; detail?: string; status: StepStatus }

type CaptionLike = string | ({ content?: string; text?: string; id?: unknown } & Record<string, unknown>)

function extractCaptions(data: unknown): CaptionLike[] {
  if (!data) return []
  if (Array.isArray(data)) return data as CaptionLike[]
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.captions)) return obj.captions as CaptionLike[]
    if (Array.isArray(obj.data)) return obj.data as CaptionLike[]
    if (Array.isArray(obj.results)) return obj.results as CaptionLike[]
  }
  return []
}

const initialSteps: PipelineStep[] = [
  { id: 'presigned', label: 'Get upload URL', status: 'idle' },
  { id: 'upload', label: 'Upload image to storage', status: 'idle' },
  { id: 'register', label: 'Register image URL', status: 'idle' },
  { id: 'generate', label: 'Generate captions', status: 'idle' },
]

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'done')
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)' }}
      >
        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  if (status === 'error')
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
      >
        <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    )
  if (status === 'running')
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 animate-pulse"
        style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)' }}
      >
        <svg className="w-3.5 h-3.5 text-violet-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
    </div>
  )
}

export default function TestFlavorClient({
  flavors,
  initialFlavorId,
}: {
  flavors: Flavor[]
  initialFlavorId: string | null
}) {
  const [selectedFlavorId, setSelectedFlavorId] = useState(initialFlavorId ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(initialSteps)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [result, setResult] = useState<unknown>(null)
  const [ran, setRan] = useState(false)

  function setStep(id: string, status: StepStatus, detail?: string) {
    setPipelineSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, detail } : s))
    )
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setResult(null)
    setRan(false)
    setErrorMsg(null)
    setPipelineSteps(initialSteps)
    if (f) setFilePreview(URL.createObjectURL(f))
    else setFilePreview(null)
  }

  async function handleRun() {
    if (!file || !selectedFlavorId || isRunning) return
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setErrorMsg(`Unsupported file type: ${file.type}`)
      return
    }

    setIsRunning(true)
    setResult(null)
    setRan(false)
    setErrorMsg(null)
    setPipelineSteps(initialSteps)

    try {
      setStep('presigned', 'running')
      const { presignedUrl, cdnUrl } = await getPresignedUrl(file.type)
      setStep('presigned', 'done', cdnUrl)

      setStep('upload', 'running')
      const uploadResp = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadResp.ok) throw new Error(`Upload failed (${uploadResp.status})`)
      setStep('upload', 'done', `${(file.size / 1024).toFixed(1)} KB`)

      setStep('register', 'running')
      const { imageId } = await registerImage(cdnUrl)
      setStep('register', 'done', imageId)

      setStep('generate', 'running')
      const data = await generateCaptions(imageId, selectedFlavorId)
      const immediateCaptions = extractCaptions(data)

      if (immediateCaptions.length > 0) {
        setStep('generate', 'done', `${immediateCaptions.length} caption(s)`)
        setResult(data)
      } else {
        setStep('generate', 'running', 'Waiting for captions to appear…')
        let dbCaptions: Array<{ id: string; content: string | null; created_datetime_utc: string | null }> = []
        for (let i = 0; i < 12; i++) {
          dbCaptions = await getGeneratedCaptions(imageId, selectedFlavorId)
          if (dbCaptions.length > 0) break
          await sleep(1500)
        }
        setStep(
          'generate',
          'done',
          dbCaptions.length > 0 ? `${dbCaptions.length} caption(s)` : 'Completed (no captions returned yet)'
        )
        setResult(dbCaptions.length > 0 ? { captions: dbCaptions } : data)
      }

      setRan(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setErrorMsg(msg)
      setPipelineSteps((prev) =>
        prev.map((s) => (s.status === 'running' ? { ...s, status: 'error' } : s))
      )
    } finally {
      setIsRunning(false)
    }
  }

  function reset() {
    setResult(null)
    setRan(false)
    setFile(null)
    setFilePreview(null)
    setErrorMsg(null)
    setPipelineSteps(initialSteps)
  }

  const captions = extractCaptions(result)
  const selectedFlavor = flavors.find((f) => f.id === selectedFlavorId)
  const hasStarted = pipelineSteps.some((s) => s.status !== 'idle')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-2">
          Prompt Chain Tool
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Test Flavor</h1>
        <p className="text-sm text-zinc-500 mt-1.5">
          Upload an image and run it through a humor flavor&apos;s full prompt chain.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left: config + pipeline */}
        <div className="col-span-3 space-y-5">
          {/* Config card */}
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Flavor selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Humor flavor
              </label>
              <select
                className="w-full bg-zinc-800/60 border border-zinc-700/60 text-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all"
                value={selectedFlavorId}
                onChange={(e) => setSelectedFlavorId(e.target.value)}
                disabled={isRunning}
              >
                <option value="">— Select a humor flavor —</option>
                {flavors.map((f) => (
                  <option key={f.id} value={f.id}>{f.slug}</option>
                ))}
              </select>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Image
              </label>
              <label
                className="flex flex-col items-center justify-center gap-2 w-full rounded-xl cursor-pointer transition-all"
                style={{
                  border: '1px dashed rgba(255,255,255,0.1)',
                  background: file ? 'rgba(139,92,246,0.04)' : 'rgba(255,255,255,0.02)',
                  padding: file ? '12px' : '28px 16px',
                  borderColor: file ? 'rgba(139,92,246,0.25)' : undefined,
                }}
              >
                {file ? (
                  <div className="flex items-center gap-3 w-full">
                    {filePreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={filePreview}
                        alt="preview"
                        className="w-14 h-14 object-cover rounded-lg shrink-0"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm text-zinc-200 font-medium truncate">{file.name}</div>
                      <div className="text-xs text-zinc-600 mt-0.5">{(file.size / 1024).toFixed(1)} KB · {file.type}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); reset() }}
                      className="ml-auto text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-zinc-400">Drop image here or click to browse</div>
                      <div className="text-xs text-zinc-700 mt-0.5">JPEG · PNG · WebP · GIF · HEIC</div>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept={SUPPORTED_TYPES.join(',')}
                  onChange={handleFileChange}
                  disabled={isRunning}
                  className="sr-only"
                />
              </label>
            </div>

            {/* Error */}
            {errorMsg && (() => {
              const isMissingSteps =
                errorMsg.toLowerCase().includes('steps not found') ||
                errorMsg.toLowerCase().includes('flavor steps not found')

              return (
                <div
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-red-400 leading-relaxed">{errorMsg}</p>
                    {isMissingSteps && selectedFlavorId && (
                      <a
                        href={`/admin/humor-flavor-steps?flavorId=${selectedFlavorId}`}
                        className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add prompt chain steps to this flavor →
                      </a>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Run button */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleRun}
                disabled={isRunning || !file || !selectedFlavorId}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Running…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                    </svg>
                    Run pipeline
                  </>
                )}
              </button>
              {ran && (
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-zinc-400 hover:text-zinc-200 text-sm font-medium rounded-xl transition-colors"
                >
                  Reset
                </button>
              )}
              {selectedFlavor && (
                <span className="text-xs text-zinc-700 ml-auto font-mono">
                  {selectedFlavor.slug}
                </span>
              )}
            </div>
          </div>

          {/* Pipeline steps */}
          {hasStarted && (
            <div
              className="rounded-2xl p-5"
              style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-4">
                Pipeline
              </div>
              <div className="space-y-0">
                {pipelineSteps.map((step, idx) => (
                  <div key={step.id} className="flex gap-4">
                    {/* Connector */}
                    <div className="flex flex-col items-center">
                      <StepIcon status={step.status} />
                      {idx < pipelineSteps.length - 1 && (
                        <div
                          className="w-px flex-1 my-1.5"
                          style={{
                            background:
                              step.status === 'done'
                                ? 'rgba(52,211,153,0.25)'
                                : 'rgba(255,255,255,0.06)',
                          }}
                        />
                      )}
                    </div>
                    {/* Label */}
                    <div className={`pb-${idx < pipelineSteps.length - 1 ? '3' : '0'} pt-1 min-w-0`}>
                      <div
                        className={`text-sm font-medium transition-colors ${
                          step.status === 'done'
                            ? 'text-emerald-400'
                            : step.status === 'error'
                              ? 'text-red-400'
                              : step.status === 'running'
                                ? 'text-violet-300'
                                : 'text-zinc-700'
                        }`}
                      >
                        {step.label}
                      </div>
                      {step.detail && (
                        <div className="text-xs text-zinc-600 mt-0.5 font-mono truncate max-w-xs">
                          {step.detail}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: results */}
        <div className="col-span-2">
          {ran && captions.length > 0 ? (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-zinc-600 uppercase tracking-widest">
                Generated captions ({captions.length})
              </div>
              <div className="space-y-3">
                {captions.map((c, i) => {
                  const text = typeof c === 'string' ? c : (c.content ?? c.text ?? JSON.stringify(c))
                  return (
                    <div
                      key={i}
                      className="rounded-2xl p-5 relative overflow-hidden"
                      style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div
                        className="absolute top-3 right-3 text-4xl font-serif leading-none text-zinc-800 pointer-events-none select-none"
                        aria-hidden="true"
                      >
                        &ldquo;
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-violet-400"
                          style={{ background: 'rgba(139,92,246,0.12)' }}
                        >
                          {i + 1}
                        </div>
                        <div className="text-[10px] font-semibold text-zinc-700 uppercase tracking-wider">
                          Caption
                        </div>
                      </div>
                      <p className="text-sm text-zinc-200 leading-relaxed">{String(text)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : ran ? (
            <div
              className="rounded-2xl p-6 text-center h-full flex flex-col items-center justify-center gap-3"
              style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="text-sm text-zinc-600">No caption data returned.</div>
            </div>
          ) : (
            <div
              className="rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.06)',
                minHeight: '180px',
              }}
            >
              <svg className="w-8 h-8 text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <div className="text-sm text-zinc-700">Captions will appear here</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
