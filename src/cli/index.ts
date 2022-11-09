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

import { convertComposeConfigFiles } from './convert-compose'
import { convertConfigFiles } from './convert-config'
import { parseArgs } from './init'
import type { Converter, Permutation } from './types'

const permutationToConverterMap: { [key in Permutation]?: Converter } = {
  v1v2compose: convertComposeConfigFiles,
  v1v2config: convertConfigFiles,
}

const cli = async () => {
  const context = parseArgs()

  const permutation: Permutation = `v${context.from}v${context.to}${context.mode}`
  const converter = permutationToConverterMap[permutation]

  if (!converter) {
    throw new TypeError(`No operation found for conversion "${context.mode}" from v${context.from} to v${context.to}`)
  }

  await converter(context)
}

cli().catch(console.error)
