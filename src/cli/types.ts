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

import type { Logger } from './utils'

export enum Version {
  V1 = 1,
  V2 = 2
}

export enum ConversionMode {
  COMPOSE = 'compose',
  CONFIG = 'config'
}

export type Permutation = `v${Version}v${Version}${ConversionMode}`

export type Converter = (ctx: CliContext) => Promise<void>

export interface CliOptions {
  dir?: string
  elementComposerUrlRegex?: RegExp
  from: Version
  mode: ConversionMode
  quiet?: boolean
  to: Version
}

export interface CliContext extends Omit<CliOptions, 'quiet'>{
  fileAbsPaths: string[]
  logger: Logger
}

export type WithAcl<T = Record<string, unknown>> = T & { aclExpression?: string }
