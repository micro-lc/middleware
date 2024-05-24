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

import type { FastifyRequest } from 'fastify'

import type { RuntimeConfig } from '../config'

export interface AclContext {
  groups: string[]
  permissions: string[]
}

const getPermissions = (config: RuntimeConfig, request: FastifyRequest): string[] => {
  const { USER_PROPERTIES_HEADER_KEY: user } = config
  const userProperties = user !== undefined ? request.headers[user] ?? '{}' : '{}'
  if (typeof userProperties !== 'string') { return [] }

  const parsedProperties = JSON.parse(userProperties) as { permissions?: string[] }
  return parsedProperties.permissions ?? []
}

const cleanHeaders = (headers: Record<string, string | string[] | undefined>): Record<string, string | string[] | undefined> => {
  delete headers.cookie
  return headers
}

export const extractAclContext = (
  config: RuntimeConfig,
  request: FastifyRequest
): AclContext => {
  if (config.ACL_CONTEXT_BUILDER !== undefined) {
    const permissions = config.ACL_CONTEXT_BUILDER({
      headers: cleanHeaders(request.headers),
      method: request.method,
      pathParams: request.params,
      queryParams: request.query,
      url: request.url,
    })
    return { groups: [], permissions }
  }
  // todo
  // @ts-expect-error this is a decorated request
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const groups = request.getGroups() as string[]
  const permissions = getPermissions(config, request)

  return { groups, permissions }
}
