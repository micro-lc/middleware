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

export const evaluateLanguage = (json: Json, labelsMap: Record<string, string> | undefined): Json => {
  if (labelsMap === undefined) {
    return json
  }

  const customizer = buildCustomizer(labelsMap)
  const clonedJson = cloneDeepWith(json, customizer) as Json
  return clonedJson
}
