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


const getPermissions = (config: RuntimeConfig, request: FastifyRequest): string[] => {
  const { USER_PROPERTIES_HEADER_KEY: user } = config
  const userProperties = user !== undefined ? request.headers[user] ?? '{}' : '{}'
  if (typeof userProperties !== 'string') { return [] }

  const parsedProperties = JSON.parse(userProperties) as { permissions?: string[] }
  return parsedProperties.permissions ?? []
}

export const extractAclContext = async (
  config: RuntimeConfig,
  request: FastifyRequest
): Promise<string[]> => {
  if (config.ACL_CONTEXT_BUILDER !== undefined) {
    const aclContext = await config.ACL_CONTEXT_BUILDER({
      body: request.body,
      headers: request.headers,
      method: request.method,
      pathParams: request.params,
      queryParams: request.query,
      url: request.url,
    })

    // SAFETY: check the actual outcome of the function because is externally defined
    return Array.isArray(aclContext)
      ? aclContext.filter(element => typeof element === 'string')
      : []
  }

  // @ts-expect-error this is a decorated request
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const groups = request.getGroups() as string[]
  const permissions = getPermissions(config, request)

  const aclContext: string[] = []
  aclContext.push(...groups.map(group => `groups.${group}`))
  aclContext.push(...permissions.map(permission => `permissions.${permission}`))
  return aclContext
}
