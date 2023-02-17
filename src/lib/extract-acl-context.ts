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

import type { DecoratedFastify, DecoratedRequest } from '@mia-platform/custom-plugin-lib'

import type { EnvironmentVariables } from '../schemas/environmentVariablesSchema'
import type { FastifyEnvironmentVariables } from '../server'

export interface AclContext {
  groups: string[]
  permissions: string[]
}

const getPermissions = (service: DecoratedFastify<FastifyEnvironmentVariables>, request: DecoratedRequest): string[] => {
  const { config: { USER_PROPERTIES_HEADER_KEY: user } } = service
  const userProperties = user !== undefined ? request.headers[user] ?? '{}' : '{}'
  if (typeof userProperties !== 'string') { return [] }

  const parsedProperties = JSON.parse(userProperties) as { permissions?: string[] }
  return parsedProperties.permissions ?? []
}

export const extractAclContext = (
  service: DecoratedFastify<EnvironmentVariables>,
  request: DecoratedRequest
): AclContext => {
  const groups = request.getGroups()
  const permissions = getPermissions(service, request)

  return { groups, permissions }
}
