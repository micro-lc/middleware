import type { RuntimeConfig } from '../config'

export interface LanguageContext {
  chosenLanguage: string
  labelsMap: Record<string, string>
}

export const extractLanguageContext = (config: RuntimeConfig, acceptedLanguages: string[]): LanguageContext => {
  const { LANGUAGES_CONFIG: languagesConfig } = config

  for (const language of acceptedLanguages) {
    for (const langConfig of languagesConfig) {
      if (langConfig.languageId === language) {
        return {
          chosenLanguage: language,
          labelsMap: langConfig.labelsMap,
        }
      }
    }
  }

  const relaxedAcceptedLanguages = acceptedLanguages.map(language => language.split('-')[0])
  for (const language of relaxedAcceptedLanguages) {
    for (const langConfig of languagesConfig) {
      if (langConfig.languageId.split('-')[0] === language) {
        return {
          chosenLanguage: language,
          labelsMap: langConfig.labelsMap,
        }
      }
    }
  }

  // TODO gestire default
  return {
    chosenLanguage: '',
    labelsMap: {},
  }
}
