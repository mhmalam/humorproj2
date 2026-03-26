'use server'

import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-service'
import { getAdminViewer } from '@/lib/admin-auth'

const API_BASE = 'https://api.almostcrackd.ai'

async function getAccessToken(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('No active session — please sign in again')
  return token
}

export async function getPresignedUrl(
  contentType: string
): Promise<{ presignedUrl: string; cdnUrl: string }> {
  const gate = await getAdminViewer()
  if (!gate.ok) throw new Error('Unauthorized')

  const token = await getAccessToken()

  const resp = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contentType }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Presigned URL request failed (${resp.status}): ${text}`)
  }

  const data = await resp.json()
  return { presignedUrl: data.presignedUrl, cdnUrl: data.cdnUrl }
}

/** Step 3: register the CDN URL and get back an imageId */
export async function registerImage(imageUrl: string): Promise<{ imageId: string }> {
  const gate = await getAdminViewer()
  if (!gate.ok) throw new Error('Unauthorized')

  const token = await getAccessToken()

  const resp = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageUrl, isCommonUse: false }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Register image failed (${resp.status}): ${text}`)
  }

  const data = await resp.json()
  return { imageId: data.imageId as string }
}

/** Step 4: generate captions for a registered image + flavor */
export async function generateCaptions(
  imageId: string,
  humorFlavorId: string
): Promise<unknown> {
  const gate = await getAdminViewer()
  if (!gate.ok) throw new Error('Unauthorized')

  const token = await getAccessToken()

  const resp = await fetch(`${API_BASE}/pipeline/generate-captions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageId, humorFlavorId }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Generate captions failed (${resp.status}): ${text}`)
  }

  return resp.json()
}

export async function getGeneratedCaptions(
  imageId: string,
  humorFlavorId: string
): Promise<Array<{ id: string; content: string | null; created_datetime_utc: string | null }>> {
  const gate = await getAdminViewer()
  if (!gate.ok) throw new Error('Unauthorized')

  const service = createServiceClient()
  const { data, error } = await service
    .from('captions')
    .select('id, content, created_datetime_utc')
    .eq('image_id', imageId)
    .eq('humor_flavor_id', humorFlavorId)
    .order('created_datetime_utc', { ascending: false })
    .limit(30)

  if (error) throw new Error(`Fetch generated captions failed: ${error.message}`)
  return (data ?? []) as Array<{ id: string; content: string | null; created_datetime_utc: string | null }>
}
