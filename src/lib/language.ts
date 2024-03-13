import { readdir } from 'fs/promises'
import path from 'path'

import type { RuntimeConfig } from '../config'

export interface LanguageContext {
  filepath: string
  language: string
}

const jsonExtension = '.json'

export const extractLanguageContext = async (config: RuntimeConfig, acceptedLanguages: string[]): Promise<LanguageContext> => {
  const { LANGUAGES_DIRECTORY_PATH: languagesDir } = config
  const languageFilenames = await readdir(languagesDir)

  let chosenFile: string | undefined
  let acceptedLanguage = acceptedLanguages.find(language =>
    languageFilenames.some(filename => {
      if (path.basename(filename, jsonExtension) === language) {
        chosenFile = filename
        return true
      }
      return false
    })
  )
  if (acceptedLanguage !== undefined && chosenFile !== undefined) {
    return {
      filepath: path.join(languagesDir, chosenFile),
      language: acceptedLanguage,
    }
  }

  acceptedLanguage = acceptedLanguages
    .map(language => language.split('-')[0])
    .find(language =>
      languageFilenames.some(filename => {
        if (path.basename(filename, jsonExtension).split('-')[0] === language) {
          chosenFile = filename
          return true
        }
        return false
      })
    )
  if (acceptedLanguage !== undefined && chosenFile !== undefined) {
    return {
      filepath: path.join(languagesDir, chosenFile),
      language: acceptedLanguage,
    }
  }

  // TODO gestire default
  return {
    filepath: '',
    language: '',
  }
}
