import { readFile } from 'fs/promises'

import { applyOperation, deepClone } from 'fast-json-patch'
import { JSONPath } from 'jsonpath-plus'

import type { Json } from './types'

export const resolveTranslations = async (json: Json, languageFilepath: string): Promise<Json> => {
  const clonedJson = deepClone(json) as object | unknown[]
  if (!clonedJson || typeof clonedJson === 'number' || typeof clonedJson === 'boolean') {
    return clonedJson
  }

  const translations = JSON.parse(await readFile(languageFilepath, { encoding: 'utf-8' })) as Record<string, string | undefined>
  const valuesToReplace: string[] = []
  do {
    valuesToReplace.splice(0)
    // TODO capire come scrivere la funzione
    JSONPath({ json: clonedJson, resultType: 'pointer' })

    const [pathToReplace] = valuesToReplace
    if (pathToReplace) {
      // TODO capire come gestire i diversi tipi di clonedJson
      const translationKey: string = clonedJson[pathToReplace]
      applyOperation(clonedJson, { op: 'replace', path: pathToReplace, value: translations[translationKey] })
    }
  } while (valuesToReplace.length !== 0)

  return clonedJson
}
