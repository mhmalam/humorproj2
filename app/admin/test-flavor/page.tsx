import { createServiceClient } from '@/lib/supabase-service'
import TestFlavorClient, { type Flavor } from './TestFlavorClient'

export default async function TestFlavorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const flavorId = typeof params.flavorId === 'string' ? params.flavorId : null

  const service = createServiceClient()
  const { data } = await service
    .from('humor_flavors')
    .select('id, slug')
    .order('id', { ascending: true })
    .limit(500)

  return <TestFlavorClient flavors={(data ?? []) as Flavor[]} initialFlavorId={flavorId} />
}
