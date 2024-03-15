/*
 * Copyright 2022 Mia srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { LanguageConfig, RuntimeConfig } from '../config'

export interface LanguageContext {
  chosenLanguage: string
  labelsMap?: Record<string, string>
}

const noLanguageContext: LanguageContext = { chosenLanguage: '' }

const extractExactLanguage = (languagesConfig: LanguageConfig[], acceptedLanguages: string[]): LanguageContext | undefined => {
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
}

const extractRelaxedLanguage = (languagesConfig: LanguageConfig[], acceptedLanguages: string[]): LanguageContext | undefined => {
  const relaxedAcceptedLanguages = acceptedLanguages.map(language => language.split('-')[0])
  for (const relaxedLanguage of relaxedAcceptedLanguages) {
    for (const langConfig of languagesConfig) {
      if (langConfig.languageId.split('-')[0] === relaxedLanguage) {
        return {
          chosenLanguage: relaxedLanguage,
          labelsMap: langConfig.labelsMap,
        }
      }
    }
  }
}

const extractDefaultLanguage = (languagesConfig: LanguageConfig[], defaultContentLanguage: string): LanguageContext | undefined => {
  return extractExactLanguage(languagesConfig, [defaultContentLanguage])
    ?? extractRelaxedLanguage(languagesConfig, [defaultContentLanguage])
}

export const extractLanguageContext = (config: RuntimeConfig, acceptedLanguages: string[]): LanguageContext => {
  const {
    DEFAULT_CONTENT_LANGUAGE: defaultContentLanguage,
    LANGUAGES_CONFIG: languagesConfig,
  } = config

  return extractExactLanguage(languagesConfig, acceptedLanguages)
    ?? extractRelaxedLanguage(languagesConfig, acceptedLanguages)
    ?? extractDefaultLanguage(languagesConfig, defaultContentLanguage)
    ?? noLanguageContext
}
