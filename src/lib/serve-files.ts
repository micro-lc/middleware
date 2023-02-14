
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
import util from 'util'

import glob from 'glob'
import * as yaml from 'js-yaml'

import { evaluateAcl, resolveReferences } from '../sdk'
import type { Json } from '../sdk'
import type { FastifyContext } from '../server'

import { extractAclContext } from './extract-acl-context'

type Extension = '.json' | '.yml' | '.yaml'

type FileLoader = (fileAbsPath: string, ...args: string[][]) => Promise<unknown>
type JsonFileLoader = (fileAbsPath: string, aclGroups: string[], aclPermissions: string[]) => Promise<Json>

const globPromise = util.promisify(glob)

const manipulateJson = async (json: Json, aclGroups: string[], aclPermissions: string[]): Promise<Json> => {
  const filteredContent = evaluateAcl(json, aclGroups, aclPermissions)
  const resolvedJson = await resolveReferences(filteredContent)

  if (resolvedJson && typeof resolvedJson === 'object' && 'definitions' in resolvedJson) {
    delete (resolvedJson as { definitions?: unknown }).definitions
  }

  return resolvedJson
}

const loadJsonFile: JsonFileLoader = async (fileAbsPath, ...args: string[][]) => {
  const rawContent = await fs.promises.readFile(fileAbsPath, 'utf-8')
  const json = JSON.parse(rawContent) as Json
  return manipulateJson(json, args[0], args[1])
}

const loadYamlFile: JsonFileLoader = async (fileAbsPath, ...args: string[][]) => {
  const rawContent = await fs.promises.readFile(fileAbsPath, 'utf-8')
  const json = yaml.load(rawContent) as Json
  return manipulateJson(json, args[0], args[1])
}

const loadTextFile: FileLoader = async (fileAbsPath) => fs.promises.readFile(fileAbsPath)

function getLoader(extension: string): FileLoader {
  switch (extension) {
  case '.json':
    return loadJsonFile
  case '.yaml':
  case '.yml':
    return loadYamlFile
  default:
    return loadTextFile
  }
}

function getDumper(extension: Extension | string): (content: unknown) => unknown {
  switch (extension) {
  case '.yaml':
  case '.yml':
    return (json) => yaml.dump(json)
  case '.json':
  default:
    return (content) => content
  }
}

async function registerRoutes(this: FastifyContext) {
  const { service, config: { CONTENT_TYPE_MAP: contentTypeDictionary, RESOURCES_DIRECTORY_PATH } } = this

  const winSeparatorRegex = new RegExp(`\\${path.win32.sep}`, 'g')
  const configGlobPattern = path
    .join(RESOURCES_DIRECTORY_PATH, '**/*')
    .replace(winSeparatorRegex, path.posix.sep)

  const configRoutes = new Set()
  const configFileAbsPaths = await globPromise(configGlobPattern, { nodir: true })

  for (const fileAbsPath of configFileAbsPaths) {
    const fileRelPath = fileAbsPath
      .replace(RESOURCES_DIRECTORY_PATH.replace(/\\/g, '/'), '')
      .replace(/^\//, '')

    const route = (`/configurations/${fileRelPath}`).replace(/\/\//g, '/')
    if (configRoutes.has(route)) { continue }
    configRoutes.add(route)

    const fileExtension = path.extname(fileRelPath) as `.${string}` | ''

    const contentType = fileExtension === '' ? undefined : contentTypeDictionary[fileExtension] as string | undefined
    const fileLoader = getLoader(fileExtension)
    const contentDumper = getDumper(fileExtension)

    service.addRawCustomPlugin('GET', route, async (request, reply) => {
      const aclContext = extractAclContext(service, request)
      const manipulatedContent = await fileLoader(fileAbsPath, aclContext.groups, aclContext.permissions)

      const payload = contentDumper(manipulatedContent)

      return reply
        .header('Content-Type', contentType ?? 'text/plain')
        .code(200)
        .send(payload)
    })
  }
}

export { registerRoutes }
