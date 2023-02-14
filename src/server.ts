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
import type { AsyncInitFunction, DecoratedFastify } from '@mia-platform/custom-plugin-lib'
import customService from '@mia-platform/custom-plugin-lib'

import type { RuntimeConfig } from './config'
import { parseConfig } from './config'
import { registerRoutes } from './lib/serve-files'
import { registerPublic, staticFileHandler } from './lib/serve-public'
import type { EnvironmentVariables } from './schemas/environmentVariablesSchema'
import { environmentVariablesSchema } from './schemas/environmentVariablesSchema'

interface FastifyContext {
  config: RuntimeConfig
  service: DecoratedFastify<EnvironmentVariables>
}

const initFunction: AsyncInitFunction<EnvironmentVariables> = async service => {
  const runtimeConfig = parseConfig(service.config)
  const context: FastifyContext = { config: runtimeConfig, service }

  service.addHook('onSend', staticFileHandler(runtimeConfig))

  await Promise.all([
    registerPublic.call(context),
    registerRoutes.call(context),
  ])
    .catch(console.error)
}

export type { FastifyContext }
module.exports = customService<EnvironmentVariables>(environmentVariablesSchema)(initFunction) as unknown
