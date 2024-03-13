import { readdir } from 'fs/promises'
import { basename } from 'path'

import type { RuntimeConfig } from '../config'

export const chooseLanguage = async (config: RuntimeConfig, acceptedLanguages: string[]): Promise<string> => {
  const { LANGUAGES_DIRECTORY_PATH: languagesDir } = config
  const availableLanguages = (await readdir(languagesDir)).map(filename => basename(filename, '.json'))

  let acceptedLanguage = acceptedLanguages.find(language => availableLanguages.includes(language))
  if (acceptedLanguage !== undefined) { return acceptedLanguage }

  acceptedLanguage = acceptedLanguages
    .map(language => language.split('-')[0])
    .find(language => availableLanguages
      .map(availableLanguage => availableLanguage.split('-')[0])
      .includes(language))
  if (acceptedLanguage !== undefined) { return acceptedLanguage }

  // TODO gestire default
  return ''
}
