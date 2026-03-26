import { createServiceClient } from '@/lib/supabase-service'
import StepsClient, {
  type Flavor,
  type FlavorStepTypeOption,
  type InputTypeOption,
  type LlmModelOption,
  type OutputTypeOption,
  type Step,
} from './StepsClient'

export default async function AdminHumorFlavorStepsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const flavorId = typeof params.flavorId === 'string' ? params.flavorId : null

  const service = createServiceClient()

  const [{ data: flavorsData }, { data: modelsData }, { data: inputTypesData }, { data: outputTypesData }, { data: stepTypesData }] = await Promise.all([
    service
      .from('humor_flavors')
      .select('id, slug')
      .order('id', { ascending: true })
      .limit(500),
    service
      .from('llm_models')
      .select('id, name, provider_model_id')
      .order('id', { ascending: true })
      .limit(500),
    service
      .from('llm_input_types')
      .select('id, slug, description')
      .order('id', { ascending: true })
      .limit(100),
    service
      .from('llm_output_types')
      .select('id, slug, description')
      .order('id', { ascending: true })
      .limit(100),
    service
      .from('humor_flavor_step_types')
      .select('id, slug, description')
      .order('id', { ascending: true })
      .limit(100),
  ])

  const flavors = (flavorsData ?? []) as Flavor[]

  let steps: Step[] = []
  if (flavorId) {
    const { data: stepsData } = await service
      .from('humor_flavor_steps')
      .select(
        'id, humor_flavor_id, order_by, llm_input_type_id, llm_output_type_id, llm_model_id, humor_flavor_step_type_id, llm_temperature, llm_system_prompt, llm_user_prompt'
      )
      .eq('humor_flavor_id', flavorId)
      .order('order_by', { ascending: true })
      .limit(200)
    steps = (stepsData ?? []) as Step[]
  }

  return (
    <StepsClient
      flavors={flavors}
      steps={steps}
      selectedFlavorId={flavorId}
      models={(modelsData ?? []) as LlmModelOption[]}
      inputTypes={(inputTypesData ?? []) as InputTypeOption[]}
      outputTypes={(outputTypesData ?? []) as OutputTypeOption[]}
      stepTypes={(stepTypesData ?? []) as FlavorStepTypeOption[]}
    />
  )
}
