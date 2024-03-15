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

import { expect } from 'chai'

import type { LanguageConfig, RuntimeConfig } from '../../config'
import type { LanguageContext } from '../extract-language-context'
import { extractLanguageContext } from '../extract-language-context'

describe('Extract Language Context', () => {
  const config: RuntimeConfig = {
    CONTENT_TYPE_MAP: {},
    DEFAULT_CONTENT_LANGUAGE: 'en-UK',
    LANGUAGES_CONFIG: [
      {
        labelsMap: { hello: 'hello' },
        languageId: 'en-UK',
      },
      {
        labelsMap: { hello: 'ciao' },
        languageId: 'it-IT',
      },
      {
        labelsMap: { hello: 'hallo' },
        languageId: 'de',
      },
    ],
    LANGUAGES_DIRECTORY_PATH: '',
    PUBLIC_DIRECTORY_PATH: '',
    PUBLIC_HEADERS_MAP: {},
    RESOURCES_DIRECTORY_PATH: '',
    SERVICE_CONFIG_PATH: '',
    USER_PROPERTIES_HEADER_KEY: '',
  }

  interface Test {
    acceptedLanguages: string[]
    defaultContentLanguage?: string
    expected: LanguageContext
    languagesConfig?: LanguageConfig[]
    message: string
  }

  const tests: Test[] = [
    {
      acceptedLanguages: ['jp-JP', 'it-IT', 'en-UK'],
      expected: {
        chosenLanguage: 'it-IT',
        labelsMap: { hello: 'ciao' },
      },
      message: 'should extract context by exact match (order of acceptedLanguages matters)',
    },
    {
      acceptedLanguages: ['de-DE', 'it'],
      expected: {
        chosenLanguage: 'de',
        labelsMap: { hello: 'hallo' },
      },
      message: 'should extract context by relaxed match',
    },
    {
      acceptedLanguages: ['es-ES'],
      expected: {
        chosenLanguage: 'en-UK',
        labelsMap: { hello: 'hello' },
      },
      message: 'should extract context by default exact match',
    },
    {
      acceptedLanguages: ['es-ES'],
      defaultContentLanguage: 'it',
      expected: {
        chosenLanguage: 'it',
        labelsMap: { hello: 'ciao' },
      },
      message: 'should extract context by default relaxed match',
    },
    {
      acceptedLanguages: ['en-US'],
      expected: {
        chosenLanguage: '',
      },
      languagesConfig: [],
      message: 'should return no context',
    },
  ]

  tests.forEach(({ acceptedLanguages, defaultContentLanguage, expected, languagesConfig, message }, index) => {
    it(`#${index} - ${message}`, () => {
      const testConfig: RuntimeConfig = {
        ...config,
        DEFAULT_CONTENT_LANGUAGE: defaultContentLanguage ?? config.DEFAULT_CONTENT_LANGUAGE,
        LANGUAGES_CONFIG: languagesConfig ?? config.LANGUAGES_CONFIG,
      }

      const result = extractLanguageContext(testConfig, acceptedLanguages)
      expect(result).to.deep.equal(expected)
    })
  })
})
