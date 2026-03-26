'use server'

import { createServiceClient } from '@/lib/supabase-service'
import { getAdminViewer } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

type StepData = {
  llm_input_type_id: number
  llm_output_type_id: number
  llm_model_id: number
  humor_flavor_step_type_id: number
  llm_temperature: number | null
  llm_system_prompt: string | null
  llm_user_prompt: string | null
}

export async function createStep(flavorId: string, data: StepData): Promise<void> {
  const gate = await getAdminViewer()
  if (!gate.ok) throw new Error('Unauthorized')
  const actingUserId = gate.viewer.userId

  const service = createServiceClient()

  const { data: existing } = await service
    .from('humor_flavor_steps')
    .select('order_by')
    .eq('humor_flavor_id', flavorId)
    .order('order_by', { ascending: false })
    .limit(1)

  const nextOrder =
    existing && existing.length > 0 && typeof existing[0].order_by === 'number'
      ? existing[0].order_by + 1
      : 1

  const { error } = await service.from('humor_flavor_steps').insert({
    humor_flavor_id: flavorId,
    order_by: nextOrder,
    llm_input_type_id: data.llm_input_type_id,
    llm_output_type_id: data.llm_output_type_id,
    llm_model_id: data.llm_model_id,
    humor_flavor_step_type_id: data.humor_flavor_step_type_id,
    llm_temperature: data.llm_temperature,
    llm_system_prompt: data.llm_system_prompt?.trim() || null,
    llm_user_prompt: data.llm_user_prompt?.trim() || null,
    created_by_user_id: actingUserId,
    modified_by_user_id: actingUserId,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/humor-flavor-steps')
}

export async function updateStep(id: string, data: StepData): Promise<void> {
  const gate = await getAdminViewer()
  if (!gate.ok) throw new Error('Unauthorized')
  const actingUserId = gate.viewer.userId

  const service = createServiceClient()
  const { error } = await service
    .from('humor_flavor_steps')
    .update({
      llm_input_type_id: data.llm_input_type_id,
      llm_output_type_id: data.llm_output_type_id,
      llm_model_id: data.llm_model_id,
      humor_flavor_step_type_id: data.humor_flavor_step_type_id,
      llm_temperature: data.llm_temperature,
      llm_system_prompt: data.llm_system_prompt?.trim() || null,
      llm_user_prompt: data.llm_user_prompt?.trim() || null,
      modified_by_user_id: actingUserId,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/humor-flavor-steps')
}

export async function deleteStep(id: string): Promise<void> {
  const gate = await getAdminViewer()
  if (!gate.ok) throw new Error('Unauthorized')

  const service = createServiceClient()
  const { error } = await service.from('humor_flavor_steps').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/humor-flavor-steps')
}

export async function reorderSteps(flavorId: string, orderedStepIds: string[]): Promise<void> {
  const gate = await getAdminViewer()
  if (!gate.ok) throw new Error('Unauthorized')
  const actingUserId = gate.viewer.userId

  const service = createServiceClient()

  for (let i = 0; i < orderedStepIds.length; i++) {
    const { error } = await service
      .from('humor_flavor_steps')
      .update({ order_by: i + 1, modified_by_user_id: actingUserId })
      .eq('id', orderedStepIds[i])
      .eq('humor_flavor_id', flavorId)
    if (error) throw new Error(`Reorder failed: ${error.message}`)
  }

  revalidatePath('/admin/humor-flavor-steps')
}
