import { createServiceClient } from '@/lib/supabase-service'
import FlavorsClient, { type Flavor } from './FlavorsClient'

export default async function AdminHumorFlavorsPage() {
  const service = createServiceClient()
  const { data, error } = await service
    .from('humor_flavors')
    .select('id, slug, description, created_datetime_utc')
    .order('id', { ascending: true })
    .limit(500)

  if (error) {
    return (
      <div
        className="rounded-xl p-5 text-sm text-red-400"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        Failed to load flavors: {error.message}
      </div>
    )
  }

  return <FlavorsClient initialFlavors={(data ?? []) as Flavor[]} />
}
