import { DEFAULT_PARAMS, type AppSettings, type TaskParams } from '../types'
import { getActiveApiProfile, isOpenAICompatibleProvider } from './apiProfiles'
import { getImageGenerationModel, isGptImage25Model } from './imageModels'
import { normalizeCodexCliImageSize, normalizeImageSize } from './size'

export const DEFAULT_FAL_IMAGE_SIZE = '1360x1024'
export const MAX_FAL_OUTPUT_IMAGES = 4
export const MAX_OPENAI_OUTPUT_IMAGES = 10
export const MAX_PRESET_OUTPUT_IMAGES = 4

const PRESET_IMAGE_PROVIDERS = new Set(['cloudflare', 'siliconflow', 'zhipu', 'volcengine', 'dashscope'])

export function getOutputImageLimitForSettings(settings: AppSettings) {
  const provider = getActiveApiProfile(settings).provider
  if (provider === 'fal') return MAX_FAL_OUTPUT_IMAGES
  if (provider === 'cloudflare') return 1
  if (PRESET_IMAGE_PROVIDERS.has(provider)) return MAX_PRESET_OUTPUT_IMAGES
  return MAX_OPENAI_OUTPUT_IMAGES
}

export function normalizeParamsForSettings(
  params: TaskParams,
  settings: AppSettings,
  options: { hasInputImages?: boolean } = {},
): TaskParams {
  const activeProfile = getActiveApiProfile(settings)
  const outputImageLimit = getOutputImageLimitForSettings(settings)
  const nextParams: TaskParams = {
    ...params,
    size: normalizeImageSize(params.size) || DEFAULT_PARAMS.size,
    n: Math.min(outputImageLimit, Math.max(1, params.n || DEFAULT_PARAMS.n)),
  }

  if (isOpenAICompatibleProvider(settings, activeProfile.provider) && activeProfile.codexCli) {
    nextParams.size = normalizeCodexCliImageSize(nextParams.size)
    nextParams.quality = DEFAULT_PARAMS.quality
  }

  if (activeProfile.provider === 'fal') {
    if (!options.hasInputImages && nextParams.size === 'auto') nextParams.size = DEFAULT_FAL_IMAGE_SIZE
    if (nextParams.quality === 'auto') nextParams.quality = 'high'
    nextParams.moderation = DEFAULT_PARAMS.moderation
    nextParams.output_compression = DEFAULT_PARAMS.output_compression
  }

  if (PRESET_IMAGE_PROVIDERS.has(activeProfile.provider) && nextParams.size === 'auto') {
    nextParams.size = '1024x1024'
  }

  if ((nextParams.quality === 'xhigh' || nextParams.quality === 'max') && !isGptImage25Model(getImageGenerationModel(activeProfile))) {
    nextParams.quality = 'high'
  }

  if (nextParams.output_format === 'png') {
    nextParams.output_compression = DEFAULT_PARAMS.output_compression
  }

  return nextParams
}

export function getChangedParams(current: TaskParams, next: TaskParams): Partial<TaskParams> {
  const patch: Partial<TaskParams> = {}
  for (const key of Object.keys(next) as Array<keyof TaskParams>) {
    if (current[key] !== next[key]) {
      ;(patch as Record<keyof TaskParams, TaskParams[keyof TaskParams]>)[key] = next[key]
    }
  }
  return patch
}
