/*
 * Copyright 2024 Mia srl
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

import type { AsyncHandler } from '@mia-platform/custom-plugin-lib'

import type { Json } from '../sdk'
import type { FastifyContext, FastifyEnvironmentVariables } from '../server'

import { manipulateJson } from './configurations'
import { extractAclContext } from './extract-acl-context'
import { extractLanguageContext } from './extract-language-context'

type Handler = AsyncHandler<FastifyEnvironmentVariables, { Body: Json }>

const parseConfigurationHandler = (context: FastifyContext): Handler => async (request, reply) => {
  const { config } = context
  const json = request.body

  const aclContext = await extractAclContext(config, request)
  const languageContext = extractLanguageContext(config, request.languages())

  const resolvedJson = await manipulateJson(request.log, json, aclContext, languageContext)

  reply.statusCode = 200
  return resolvedJson
}

export default parseConfigurationHandler
