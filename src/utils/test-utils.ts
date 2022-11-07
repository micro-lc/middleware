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

import type { DecoratedFastify } from '@mia-platform/custom-plugin-lib'
import type Lc39 from '@mia-platform/lc39'
import type { LogLevel } from 'fastify'

import type { EnvironmentVariables } from '../schemas/environmentVariablesSchema'

// eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
const lc39 = require('@mia-platform/lc39') as typeof Lc39

export const baseVariables = {
  ADDITIONAL_HEADERS_TO_PROXY: '',
  BACKOFFICE_HEADER_KEY: 'backoffice',
  CLIENTTYPE_HEADER_KEY: 'clienttype',
  GROUPS_HEADER_KEY: 'groups',
  MICROSERVICE_GATEWAY_SERVICE_NAME: 'microservice-gateway.example.org',
  RESOURCES_DIRECTORY_PATH: '',
  USERID_HEADER_KEY: 'miauserid',
  USER_PROPERTIES_HEADER_KEY: 'miauserproperties',
}

export async function setupFastify(
  envVariables: Record<string, string> = {},
  logLevel?: LogLevel
): Promise<DecoratedFastify<EnvironmentVariables>> {
  const service = await lc39('src/server.ts', {
    envVariables: { ...baseVariables, ...envVariables },
    logLevel: logLevel ?? 'silent',
  })

  return service as unknown as DecoratedFastify<EnvironmentVariables>
}
