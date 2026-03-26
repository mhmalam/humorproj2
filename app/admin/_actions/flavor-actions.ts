'use server'

import { createServiceClient } from '@/lib/supabase-service'
import { getAdminViewer } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

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
