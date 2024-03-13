
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

import fs from 'fs'
import path from 'path'

import type { FastifyRequest } from 'fastify'
import * as yaml from 'js-yaml'

import type { RuntimeConfig } from '../config'
import { evaluateAcl, resolveReferences } from '../sdk'
import type { Json } from '../sdk'
import { resolveTranslations } from '../sdk/resolve-translations'

import type { AclContext } from './extract-acl-context'
import { extractAclContext } from './extract-acl-context'
import type { LanguageContext } from './language'
import { extractLanguageContext } from './language'

type ExtensionOutput = '' | `.${string}`

type Extension = '.json' | '.yml' | '.yaml'

const manipulateJson = async (json: Json, aclContext: AclContext, languageContext: LanguageContext): Promise<Json> => {
  const {
    groups: aclGroups,
    permissions: aclPermissions,
  } = aclContext
  const filteredContent = evaluateAcl(json, aclGroups, aclPermissions)
  const translatedJson = resolveTranslations(filteredContent, languageContext.filepath)
  const resolvedJson = await resolveReferences(translatedJson)

  if (resolvedJson && typeof resolvedJson === 'object' && 'definitions' in resolvedJson) {
    delete (resolvedJson as { definitions?: unknown }).definitions
  }

  return resolvedJson
}

const asJson = async (buffer: Buffer, aclContext: AclContext, languageContext: LanguageContext): Promise<Json> => {
  const json = JSON.parse(buffer.toString('utf-8')) as Json
  return manipulateJson(json, aclContext, languageContext)
}

const asYaml = async (buffer: Buffer, aclContext: AclContext, languageContext: LanguageContext): Promise<Json> => {
  const json = yaml.load(buffer.toString('utf-8')) as Json
  return manipulateJson(json, aclContext, languageContext)
}

const fsCache = new Map<string, Promise<Buffer>>()

const fileLoader = async (filepath: string) => fs.promises.readFile(filepath)

const loadAs = (extension: Extension): (buffer: Buffer, aclContext: AclContext, languageContext: LanguageContext) => Promise<Json> => {
  switch (extension) {
  case '.json':
    return asJson
  case '.yaml':
  case '.yml':
    return asYaml
  }
}

const getDumper = (extension: Extension): (content: Json) => string => {
  switch (extension) {
  case '.yaml':
  case '.yml':
    return (json) => yaml.dump(json)
  case '.json':
    return (content) => JSON.stringify(content)
  }
}

const shouldManipulate = (extension: ExtensionOutput): extension is Extension =>
  ['.json', '.yaml', '.yml'].includes(extension)

interface ConfigurationResponse {
  fileBuffer: Buffer
  language?: string
}

async function configurationsHandler(request: FastifyRequest, filename: string, config: RuntimeConfig): Promise<ConfigurationResponse> {
  const fileExtension = path.extname(filename) as ExtensionOutput
  const aclContext = extractAclContext(config, request)

  const bufferPromise = fsCache.get(filename) ?? fileLoader(filename)
  fsCache.set(filename, bufferPromise)

  const buffer = await bufferPromise

  if (!shouldManipulate(fileExtension)) {
    return { fileBuffer: buffer }
  }

  const languageContext = await extractLanguageContext(config, request.languages())
  const dump = getDumper(fileExtension)
  const json = await loadAs(fileExtension)(buffer, aclContext, languageContext)

  return {
    fileBuffer: Buffer.from(dump(json), 'utf-8'),
    language: languageContext.language,
  }
}

export { configurationsHandler }
