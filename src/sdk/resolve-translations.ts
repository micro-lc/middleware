import cloneDeepWith from 'lodash.clonedeepwith'

import type { Json } from './types'

const buildCustomizer = (labelsMap: Record<string, string | undefined>) => {
  return (value: unknown) => {
    if (typeof value === 'string') {
      const translation = labelsMap[value]
      return translation
    }
  }
}

export const evaluateLanguage = (json: Json, labelsMap: Record<string, string>): Json => {
  const customizer = buildCustomizer(labelsMap)

  const clonedJson = cloneDeepWith(json, customizer) as Json
  return clonedJson
}
