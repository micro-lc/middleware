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

import { dereference } from '@apidevtools/json-schema-ref-parser'

import type { Json } from './types'

/**
 * This method resolves the references in a JSON object. It does not modify the input object.
 *
 * The method **throws** if a reference cannot be found.
 *
 * @param {(string | number | boolean | Object | Array | null)} json - Input JSON with references to be resolved
 * @returns {Promise<string | number | boolean | Object | Array | null>} JSON with references resolved
 */
export const resolveReferences = async (json: Json) : Promise<Json> => {
  if (!json || typeof json === 'number' || typeof json === 'boolean') {
    return json
  }

  return dereference(json)
}
