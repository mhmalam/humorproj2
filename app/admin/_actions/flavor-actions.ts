'use server'

import { createServiceClient } from '@/lib/supabase-service'
import { getAdminViewer } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export async function duplicateFlavor(sourceId: string, newSlug: string): Promise<void> {
  const gate = await getAdminViewer()
  if (!gate.ok) throw new Error('Unauthorized')
  const actingUserId = gate.viewer.userId

  if (!newSlug.trim()) throw new Error('New slug is required')

  const service = createServiceClient()

  const { data: source, error: srcErr } = await service
    .from('humor_flavors')
    .select('slug, description')
    .eq('id', sourceId)
    .single()
  if (srcErr || !source) throw new Error('Source flavor not found')

  const { data: newFlavor, error: createErr } = await service
    .from('humor_flavors')
    .insert({
      slug: newSlug.trim(),
      description: source.description
        ? `Copy of ${source.slug} — ${source.description}`
        : `Copy of ${source.slug}`,
      created_by_user_id: actingUserId,
      modified_by_user_id: actingUserId,
    })
    .select('id')
    .single()
  if (createErr || !newFlavor) throw new Error(createErr?.message ?? 'Failed to create duplicate flavor')

  const { data: steps, error: stepsErr } = await service
    .from('humor_flavor_steps')
    .select(
      'order_by, llm_input_type_id, llm_output_type_id, llm_model_id, humor_flavor_step_type_id, llm_temperature, llm_system_prompt, llm_user_prompt'
    )
    .eq('humor_flavor_id', sourceId)
    .order('order_by', { ascending: true })
  if (stepsErr) throw new Error(stepsErr.message)

  if (steps && steps.length > 0) {
    const newSteps = steps.map((s) => ({
      humor_flavor_id: newFlavor.id,
      order_by: s.order_by,
      llm_input_type_id: s.llm_input_type_id,
      llm_output_type_id: s.llm_output_type_id,
      llm_model_id: s.llm_model_id,
      humor_flavor_step_type_id: s.humor_flavor_step_type_id,
      llm_temperature: s.llm_temperature,
      llm_system_prompt: s.llm_system_prompt,
      llm_user_prompt: s.llm_user_prompt,
      created_by_user_id: actingUserId,
      modified_by_user_id: actingUserId,
    }))
    const { error: insertErr } = await service.from('humor_flavor_steps').insert(newSteps)
    if (insertErr) throw new Error(insertErr.message)
  }

  revalidatePath('/admin/humor-flavors')
}

export async function createFlavor(slug: string, description: string | null): Promise<void> {
  const gate = await getAdminViewer()
  if (!gate.ok) throw new Error('Unauthorized')
  const actingUserId = gate.viewer.userId

  if (!slug.trim()) throw new Error('slug is required')

  const service = createServiceClient()
  const { error } = await service.from('humor_flavors').insert({
    slug: slug.trim(),
    description: description?.trim() || null,
    created_by_user_id: actingUserId,
    modified_by_user_id: actingUserId,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/humor-flavors')
}

export async function updateFlavor(
  id: string,
  slug: string,
  description: string | null
): Promise<void> {
  const gate = await getAdminViewer()
  if (!gate.ok) throw new Error('Unauthorized')
  const actingUserId = gate.viewer.userId

  if (!slug.trim()) throw new Error('slug is required')

  const service = createServiceClient()
  const { error } = await service
    .from('humor_flavors')
    .update({
      slug: slug.trim(),
      description: description?.trim() || null,
      modified_by_user_id: actingUserId,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/humor-flavors')
}

export async function deleteFlavor(id: string): Promise<void> {
  const gate = await getAdminViewer()
  if (!gate.ok) throw new Error('Unauthorized')

  const service = createServiceClient()
  const { error } = await service.from('humor_flavors').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/humor-flavors')
}
