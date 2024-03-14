import { readFile } from 'fs/promises'

import cloneDeepWith from 'lodash.clonedeepwith'

import type { Json } from './types'

const buildCustomizer = (translations: Record<string, string | undefined>) => {
  return (value: unknown) => {
    if (typeof value === 'string') {
      const translation = translations[value]
      return translation
    }
  }
}

export const resolveTranslations = async (json: Json, languageFilepath: string): Promise<Json> => {
  const translations = JSON.parse(await readFile(languageFilepath, { encoding: 'utf-8' })) as Record<string, string | undefined>
  const customizer = buildCustomizer(translations)

  const clonedJson = cloneDeepWith(json, customizer) as Json
  return clonedJson
}
