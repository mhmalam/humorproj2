'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createStep, updateStep, deleteStep, reorderSteps } from '@/app/admin/_actions/step-actions'

export type Flavor = { id: string; slug: string }
export type LlmModelOption = { id: number; name: string; provider_model_id: string | null }
export type InputTypeOption = { id: number; slug: string; description: string | null }
export type OutputTypeOption = { id: number; slug: string; description: string | null }
export type FlavorStepTypeOption = { id: number; slug: string; description: string | null }
export type Step = {
  id: string
  humor_flavor_id: string
  order_by: number | null
  llm_input_type_id: number
  llm_output_type_id: number
  llm_model_id: number
  humor_flavor_step_type_id: number
  llm_temperature: number | null
  llm_system_prompt: string | null
  llm_user_prompt: string | null
}

const inp =
  'w-full bg-zinc-800/60 border border-zinc-700/60 text-zinc-100 placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all'
const txta = `${inp} resize-y min-h-[90px]`

const btnPrimary =
  'inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const btnGhost =
  'inline-flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-zinc-200 text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const btnDanger =
  'inline-flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const btnArrow =
  'w-7 h-7 flex items-center justify-center rounded-lg border text-xs transition-colors disabled:opacity-20 disabled:cursor-not-allowed'

export default function StepsClient({
  flavors,
  steps,
  selectedFlavorId,
  models,
  inputTypes,
  outputTypes,
  stepTypes,
}: {
  flavors: Flavor[]
  steps: Step[]
  selectedFlavorId: string | null
  models: LlmModelOption[]
  inputTypes: InputTypeOption[]
  outputTypes: OutputTypeOption[]
  stepTypes: FlavorStepTypeOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [newSystem, setNewSystem] = useState('')
  const [newUser, setNewUser] = useState('')
  const [newModelId, setNewModelId] = useState('')
  const [newInputTypeId, setNewInputTypeId] = useState('')
  const [newOutputTypeId, setNewOutputTypeId] = useState('')
  const [newStepTypeId, setNewStepTypeId] = useState('')
  const [newTemperature, setNewTemperature] = useState('1')
  const [editSystem, setEditSystem] = useState('')
  const [editUser, setEditUser] = useState('')
  const [editModelId, setEditModelId] = useState('')
  const [editInputTypeId, setEditInputTypeId] = useState('')
  const [editOutputTypeId, setEditOutputTypeId] = useState('')
  const [editStepTypeId, setEditStepTypeId] = useState('')
  const [editTemperature, setEditTemperature] = useState('1')

  const defaultModelId = String(
    models.find((m) => m.provider_model_id === 'gpt-4o-mini-2024-07-18')?.id ??
      models[0]?.id ??
      ''
  )
  const defaultInputTypeId = String(
    inputTypes.find((it) => it.slug === 'image-and-text')?.id ?? inputTypes[0]?.id ?? ''
  )
  const defaultOutputTypeId = String(
    outputTypes.find((ot) => ot.slug === 'string')?.id ?? outputTypes[0]?.id ?? ''
  )
  const defaultStepTypeId = String(
    stepTypes.find((st) => st.slug === 'general')?.id ?? stepTypes[0]?.id ?? ''
  )

  const modelNameById = new Map(models.map((m) => [m.id, m.name]))
  const inputSlugById = new Map(inputTypes.map((it) => [it.id, it.slug]))
  const outputSlugById = new Map(outputTypes.map((ot) => [ot.id, ot.slug]))
  const stepTypeSlugById = new Map(stepTypes.map((st) => [st.id, st.slug]))

  function startEdit(s: Step) {
    setEditingId(s.id)
    setEditSystem(s.llm_system_prompt ?? '')
    setEditUser(s.llm_user_prompt ?? '')
    setEditModelId(String(s.llm_model_id))
    setEditInputTypeId(String(s.llm_input_type_id))
    setEditOutputTypeId(String(s.llm_output_type_id))
    setEditStepTypeId(String(s.humor_flavor_step_type_id))
    setEditTemperature(
      typeof s.llm_temperature === 'number' ? String(s.llm_temperature) : ''
    )
    setError(null)
    setIsCreating(false)
  }

  function handleCreate() {
    if (!selectedFlavorId) return
    if (!newModelId || !newInputTypeId || !newOutputTypeId || !newStepTypeId) {
      setError('Please select model, input type, output type, and step type')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const parsedTemp =
          newTemperature.trim() === '' ? null : Number.parseFloat(newTemperature)
        if (parsedTemp !== null && Number.isNaN(parsedTemp)) {
          throw new Error('Temperature must be a valid number')
        }
        await createStep(selectedFlavorId, {
          llm_model_id: Number(newModelId),
          llm_input_type_id: Number(newInputTypeId),
          llm_output_type_id: Number(newOutputTypeId),
          humor_flavor_step_type_id: Number(newStepTypeId),
          llm_temperature: parsedTemp,
          llm_system_prompt: newSystem || null,
          llm_user_prompt: newUser || null,
        })
        setIsCreating(false)
        setNewSystem('')
        setNewUser('')
        setNewModelId(defaultModelId)
        setNewInputTypeId(defaultInputTypeId)
        setNewOutputTypeId(defaultOutputTypeId)
        setNewStepTypeId(defaultStepTypeId)
        setNewTemperature('1')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create step')
      }
    })
  }

  function handleUpdate(id: string) {
    if (!editModelId || !editInputTypeId || !editOutputTypeId || !editStepTypeId) {
      setError('Please select model, input type, output type, and step type')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const parsedTemp =
          editTemperature.trim() === '' ? null : Number.parseFloat(editTemperature)
        if (parsedTemp !== null && Number.isNaN(parsedTemp)) {
          throw new Error('Temperature must be a valid number')
        }
        await updateStep(id, {
          llm_model_id: Number(editModelId),
          llm_input_type_id: Number(editInputTypeId),
          llm_output_type_id: Number(editOutputTypeId),
          humor_flavor_step_type_id: Number(editStepTypeId),
          llm_temperature: parsedTemp,
          llm_system_prompt: editSystem || null,
          llm_user_prompt: editUser || null,
        })
        setEditingId(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save step')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this step? This cannot be undone.')) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteStep(id)
        if (editingId === id) setEditingId(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete step')
      }
    })
  }

  function handleMove(idx: number, direction: 'up' | 'down') {
    if (!selectedFlavorId) return
    const swapWith = direction === 'up' ? idx - 1 : idx + 1
    if (swapWith < 0 || swapWith >= steps.length) return
    const newOrder = [...steps]
    ;[newOrder[idx], newOrder[swapWith]] = [newOrder[swapWith], newOrder[idx]]
    setError(null)
    startTransition(async () => {
      try {
        await reorderSteps(selectedFlavorId, newOrder.map((s) => s.id))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to reorder steps')
      }
    })
  }

  const selectedFlavor = flavors.find((f) => f.id === selectedFlavorId)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-2">
            Prompt Chain Tool
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Flavor Steps</h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            Manage and reorder the prompt chain steps for each humor flavor.
          </p>
        </div>
        {selectedFlavorId && (
          <button
            className={btnPrimary}
            disabled={isPending}
            onClick={() => {
              setIsCreating(true)
              setEditingId(null)
              setError(null)
              setNewModelId(defaultModelId)
              setNewInputTypeId(defaultInputTypeId)
              setNewOutputTypeId(defaultOutputTypeId)
              setNewStepTypeId(defaultStepTypeId)
              setNewTemperature('1')
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add step
          </button>
        )}
      </div>

      {/* Flavor selector */}
      <div
        className="flex items-center gap-4 rounded-2xl px-5 py-4"
        style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider shrink-0">
          Flavor
        </label>
        <select
          className="flex-1 bg-zinc-800/60 border border-zinc-700/60 text-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all"
          value={selectedFlavorId ?? ''}
          onChange={(e) => router.push(`/admin/humor-flavor-steps?flavorId=${e.target.value}`)}
        >
          <option value="">— Select a humor flavor —</option>
          {flavors.map((f) => (
            <option key={f.id} value={f.id}>{f.slug}</option>
          ))}
        </select>
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

      {!selectedFlavorId ? (
        <div
          className="rounded-2xl px-5 py-20 text-center"
          style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <svg
            className="w-8 h-8 text-zinc-700 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <div className="text-sm text-zinc-600">Select a flavor above to manage its steps.</div>
        </div>
      ) : (
        <>
          {/* Create form */}
          {isCreating && (
            <div
              className="rounded-2xl p-6 space-y-4"
              style={{ background: '#111113', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-200">New step</h2>
                <span className="text-xs text-zinc-600">
                  Will be step {steps.length + 1}
                </span>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Model *</label>
                    <select
                      className={inp}
                      value={newModelId}
                      onChange={(e) => setNewModelId(e.target.value)}
                    >
                      <option value="">Select model</option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Temperature</label>
                    <input
                      className={inp}
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={newTemperature}
                      onChange={(e) => setNewTemperature(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Input type *</label>
                    <select
                      className={inp}
                      value={newInputTypeId}
                      onChange={(e) => setNewInputTypeId(e.target.value)}
                    >
                      <option value="">Select input type</option>
                      {inputTypes.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.slug}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Output type *</label>
                    <select
                      className={inp}
                      value={newOutputTypeId}
                      onChange={(e) => setNewOutputTypeId(e.target.value)}
                    >
                      <option value="">Select output type</option>
                      {outputTypes.map((ot) => (
                        <option key={ot.id} value={ot.id}>
                          {ot.slug}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Step type *</label>
                    <select
                      className={inp}
                      value={newStepTypeId}
                      onChange={(e) => setNewStepTypeId(e.target.value)}
                    >
                      <option value="">Select step type</option>
                      {stepTypes.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.slug}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">System prompt</label>
                  <textarea
                    className={txta}
                    value={newSystem}
                    onChange={(e) => setNewSystem(e.target.value)}
                    placeholder="You are a comedy writer with a dry wit…"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">User prompt</label>
                  <textarea
                    className={txta}
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    placeholder="Write a caption for this image…"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button className={btnPrimary} disabled={isPending} onClick={handleCreate}>
                  {isPending ? 'Creating…' : 'Add step'}
                </button>
                <button
                  className={btnGhost}
                  disabled={isPending}
                  onClick={() => {
                    setIsCreating(false)
                    setNewSystem('')
                    setNewUser('')
                    setNewModelId(defaultModelId)
                    setNewInputTypeId(defaultInputTypeId)
                    setNewOutputTypeId(defaultOutputTypeId)
                    setNewStepTypeId(defaultStepTypeId)
                    setNewTemperature('1')
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Steps list */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="px-5 py-3.5 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600">
                  {steps.length} step{steps.length !== 1 ? 's' : ''}
                </span>
                {selectedFlavor && (
                  <span className="text-xs text-zinc-700">
                    for <span className="font-mono text-violet-600">{selectedFlavor.slug}</span>
                  </span>
                )}
              </div>
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

            {steps.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="text-sm text-zinc-600">No steps yet.</div>
                <div className="text-xs text-zinc-700 mt-0.5">Add the first step above.</div>
              </div>
            ) : (
              <div>
                {steps.map((step, idx) =>
                  editingId === step.id ? (
                    <div
                      key={step.id}
                      className="p-5 space-y-4"
                      style={{
                        borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                        background: 'rgba(139,92,246,0.04)',
                      }}
                    >
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Editing step {idx + 1}
                      </h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Model *</label>
                            <select
                              className={inp}
                              value={editModelId}
                              onChange={(e) => setEditModelId(e.target.value)}
                            >
                              <option value="">Select model</option>
                              {models.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Temperature</label>
                            <input
                              className={inp}
                              type="number"
                              step="0.1"
                              min="0"
                              max="2"
                              value={editTemperature}
                              onChange={(e) => setEditTemperature(e.target.value)}
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Input type *</label>
                            <select
                              className={inp}
                              value={editInputTypeId}
                              onChange={(e) => setEditInputTypeId(e.target.value)}
                            >
                              <option value="">Select input type</option>
                              {inputTypes.map((it) => (
                                <option key={it.id} value={it.id}>
                                  {it.slug}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Output type *</label>
                            <select
                              className={inp}
                              value={editOutputTypeId}
                              onChange={(e) => setEditOutputTypeId(e.target.value)}
                            >
                              <option value="">Select output type</option>
                              {outputTypes.map((ot) => (
                                <option key={ot.id} value={ot.id}>
                                  {ot.slug}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Step type *</label>
                            <select
                              className={inp}
                              value={editStepTypeId}
                              onChange={(e) => setEditStepTypeId(e.target.value)}
                            >
                              <option value="">Select step type</option>
                              {stepTypes.map((st) => (
                                <option key={st.id} value={st.id}>
                                  {st.slug}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-500 mb-1.5">System prompt</label>
                          <textarea
                            className={txta}
                            value={editSystem}
                            onChange={(e) => setEditSystem(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-500 mb-1.5">User prompt</label>
                          <textarea
                            className={txta}
                            value={editUser}
                            onChange={(e) => setEditUser(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className={btnPrimary}
                          disabled={isPending}
                          onClick={() => handleUpdate(step.id)}
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
                      key={step.id}
                      className="flex items-start gap-4 px-5 py-5 hover:bg-white/[0.015] transition-colors group"
                      style={{ borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                    >
                      {/* Order controls */}
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                        <div
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold text-violet-300"
                          style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}
                        >
                          {idx + 1}
                        </div>
                        <button
                          className={`${btnArrow} border-zinc-800 text-zinc-700 hover:border-zinc-600 hover:text-zinc-300`}
                          disabled={isPending || idx === 0}
                          onClick={() => handleMove(idx, 'up')}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          className={`${btnArrow} border-zinc-800 text-zinc-700 hover:border-zinc-600 hover:text-zinc-300`}
                          disabled={isPending || idx === steps.length - 1}
                          onClick={() => handleMove(idx, 'down')}
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="step-meta-chip step-meta-chip-primary text-[10px] px-2 py-1 rounded-full">
                            {modelNameById.get(step.llm_model_id) ?? `model:${step.llm_model_id}`}
                          </span>
                          <span className="step-meta-chip text-[10px] px-2 py-1 rounded-full">
                            in:{inputSlugById.get(step.llm_input_type_id) ?? step.llm_input_type_id}
                          </span>
                          <span className="step-meta-chip text-[10px] px-2 py-1 rounded-full">
                            out:{outputSlugById.get(step.llm_output_type_id) ?? step.llm_output_type_id}
                          </span>
                          <span className="step-meta-chip text-[10px] px-2 py-1 rounded-full">
                            type:{stepTypeSlugById.get(step.humor_flavor_step_type_id) ?? step.humor_flavor_step_type_id}
                          </span>
                          {typeof step.llm_temperature === 'number' && (
                            <span className="step-meta-chip text-[10px] px-2 py-1 rounded-full">
                              temp:{step.llm_temperature}
                            </span>
                          )}
                        </div>
                        {step.llm_system_prompt ? (
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-700 mb-1.5 flex items-center gap-1.5">
                              <span
                                className="inline-block w-1.5 h-1.5 rounded-full"
                                style={{ background: '#7c3aed' }}
                              />
                              System
                            </div>
                            <div
                              className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap rounded-xl px-3.5 py-3"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                            >
                              {step.llm_system_prompt}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-zinc-700 italic">No system prompt</div>
                        )}
                        {step.llm_user_prompt && (
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-700 mb-1.5 flex items-center gap-1.5">
                              <span
                                className="inline-block w-1.5 h-1.5 rounded-full"
                                style={{ background: '#4f46e5' }}
                              />
                              User
                            </div>
                            <div
                              className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap rounded-xl px-3.5 py-3"
                              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                            >
                              {step.llm_user_prompt}
                            </div>
                          </div>
                        )}
                        <div className="text-[10px] text-zinc-800 font-mono">{step.id}</div>
                      </div>

                      {/* Row actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 rounded-lg transition-colors disabled:opacity-40"
                          disabled={isPending}
                          onClick={() => startEdit(step)}
                        >
                          Edit
                        </button>
                        <button className={btnDanger} disabled={isPending} onClick={() => handleDelete(step.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
