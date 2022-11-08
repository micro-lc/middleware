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

import { JSONPath } from 'jsonpath-plus'

import type { Json } from './types'

export interface JsonWithReferences {
  [key: string]: unknown
  $ref: Record<string, unknown>
  content: Record<string, unknown>
}

const mutateCallback = ($ref: JsonWithReferences['$ref']) => (payload: { $ref?: string }) => {
  Object.assign(payload, $ref[payload.$ref as string])
  delete payload.$ref
}

const replace = ({ $ref, content, ...rest }: JsonWithReferences): Json => {
  JSONPath({ callback: mutateCallback($ref), json: content, path: '$..$ref^' })
  return { $ref, content, ...rest }
}

export const resolveReferences = (configuration: Json | JsonWithReferences) : Json => {
  const isConfigurationObject = configuration && typeof configuration === 'object'
  const isReplaceable = isConfigurationObject && '$ref' in configuration && 'content' in configuration

  return isReplaceable ? replace(configuration as JsonWithReferences) : configuration
}
