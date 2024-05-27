
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

import type { FastifyBaseLogger, FastifyRequest } from 'fastify'
import * as yaml from 'js-yaml'

import type { RuntimeConfig } from '../config'
import { evaluateAcl, resolveReferences } from '../sdk'
import type { Json } from '../sdk'
import { evaluateLanguage } from '../sdk/evaluate-language'

import { extractAclContext } from './extract-acl-context'
import type { LanguageContext } from './extract-language-context'
import { extractLanguageContext } from './extract-language-context'

type ExtensionOutput = '' | `.${string}`

type Extension = '.json' | '.yml' | '.yaml'

interface ConfigurationResponse {
  fileBuffer: Buffer
  language?: string
}

const manipulateJson = async (logger: FastifyBaseLogger, json: Json, aclContext: string[], languageContext: LanguageContext): Promise<Json> => {
  const filteredContent = evaluateAcl(logger, json, aclContext)
  const translatedJson = evaluateLanguage(filteredContent, languageContext.labelsMap)
  const resolvedJson = await resolveReferences(translatedJson)

  if (resolvedJson && typeof resolvedJson === 'object' && 'definitions' in resolvedJson) {
    delete (resolvedJson as { definitions?: unknown }).definitions
  }

  return resolvedJson
}

const asJson = async (logger: FastifyBaseLogger, buffer: Buffer, aclContext: string[], languageContext: LanguageContext): Promise<Json> => {
  const json = JSON.parse(buffer.toString('utf-8')) as Json
  return manipulateJson(logger, json, aclContext, languageContext)
}

const asYaml = async (logger: FastifyBaseLogger, buffer: Buffer, aclContext: string[], languageContext: LanguageContext): Promise<Json> => {
  const json = yaml.load(buffer.toString('utf-8')) as Json
  return manipulateJson(logger, json, aclContext, languageContext)
}

const fsCache = new Map<string, Promise<Buffer>>()

const fileLoader = async (filepath: string) => fs.promises.readFile(filepath)

const loadAs = (extension: Extension): (logger: FastifyBaseLogger, buffer: Buffer, aclContext: string[], languageContext: LanguageContext) => Promise<Json> => {
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

async function configurationsHandler(request: FastifyRequest, filename: string, config: RuntimeConfig): Promise<ConfigurationResponse> {
  const bufferPromise = fsCache.get(filename) ?? fileLoader(filename)
  fsCache.set(filename, bufferPromise)
  const buffer = await bufferPromise

  const fileExtension = path.extname(filename) as ExtensionOutput
  if (!shouldManipulate(fileExtension)) {
    return { fileBuffer: buffer }
  }

  const aclContext = extractAclContext(config, request)
  const languageContext = extractLanguageContext(config, request.languages())
  const dump = getDumper(fileExtension)
  const json = await loadAs(fileExtension)(request.log, buffer, aclContext, languageContext)

  return {
    fileBuffer: Buffer.from(dump(json), 'utf-8'),
    language: languageContext.chosenLanguage,
  }
}

export { configurationsHandler }
