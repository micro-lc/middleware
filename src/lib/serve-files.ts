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

import type { Stats } from 'fs'
import fs, { statSync } from 'fs'
import path, { isAbsolute } from 'path'
import util from 'util'

import type { DecoratedFastify } from '@mia-platform/custom-plugin-lib'
import glob from 'glob'
import * as yaml from 'js-yaml'

import type { EnvironmentVariables } from '../schemas/environmentVariablesSchema'
import { evaluateAcl, resolveReferences } from '../sdk'
import type { Json } from '../sdk'

import { extractAclContext } from './extract-acl-context'

type Extension = '.json' | '.yml' | '.yaml'

type FileLoader = (fileAbsPath: string, ...args: string[][]) => Promise<unknown>
type JsonFileLoader = (fileAbsPath: string, aclGroups: string[], aclPermissions: string[]) => Promise<Json>

const DEFAULT_CONTENT_TYPE_MAP: Record<Extension | string, string> = {
  '.cjs': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'application/javascript',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
}

const globPromise = util.promisify(glob)

const validateResourcesDirectoryPath = (dirPath: string) => {
  if (!isAbsolute(dirPath)) { throw new Error('"RESOURCES_DIRECTORY_PATH" must be an absolute path') }

  let pathStat: Stats

  try {
    pathStat = statSync(dirPath)
  } catch (err) {
    if ((err as { code: string }).code === 'ENOENT') {
      throw new Error('"RESOURCES_DIRECTORY_PATH" must exist')
    }

    throw err
  }

  if (!pathStat.isDirectory()) { throw new Error('"RESOURCES_DIRECTORY_PATH" must point to a directory') }
}

const validateContentTypeMap = (stringifiedContentTypeMap: string | undefined) => {
  const candidateContentMap = stringifiedContentTypeMap === undefined || stringifiedContentTypeMap.trim() === '' ? '{}' : stringifiedContentTypeMap
  try {
    const contentTypeMap = JSON.parse(candidateContentMap) as unknown

    if (typeof contentTypeMap !== 'object' || contentTypeMap === null || Array.isArray(contentTypeMap)) {
      throw new Error('"CONTENT_TYPE_MAP" is not a valid key/value stringified JSON')
    }

    return Object.entries(contentTypeMap)
      .reduce<Record<string, string>>((dict, [key, value]) => {
        if (typeof value !== 'string') {
          return dict
        }

        return Object.assign(dict, key.split(',').reduce<Record<string, string>>((acc, ext) => {
          const trimmedExtension = ext.trim()
          if (trimmedExtension.startsWith('.')) {
            acc[trimmedExtension] = value
          }
          return acc
        }, dict))
      }, DEFAULT_CONTENT_TYPE_MAP)
  } catch (err) {
    throw new Error('"CONTENT_TYPE_MAP" is not a valid stringified JSON')
  }
}

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

export async function registerRoutes(this: DecoratedFastify<EnvironmentVariables>) {
  const { RESOURCES_DIRECTORY_PATH, CONTENT_TYPE_MAP } = this.config

  validateResourcesDirectoryPath(RESOURCES_DIRECTORY_PATH)
  const contentTypeDictionary = validateContentTypeMap(CONTENT_TYPE_MAP)

  const winSeparatorRegex = new RegExp(`\\${path.win32.sep}`, 'g')
  // const globJsonPattern = path
  //   .join(RESOURCES_DIRECTORY_PATH, '**/*.{json,yml,yaml}')
  //   .replace(winSeparatorRegex, path.posix.sep)
  const globPattern = path
    .join(RESOURCES_DIRECTORY_PATH, '**/*')
    .replace(winSeparatorRegex, path.posix.sep)

  const routesPrefix = '/'

  const routes = new Set()
  const fileAbsPaths = await globPromise(globPattern, { nodir: true })

  for (const fileAbsPath of fileAbsPaths) {
    const fileRelPath = fileAbsPath
      .replace(RESOURCES_DIRECTORY_PATH.replace(/\\/g, '/'), '')
      .replace(/^\//, '')

    const route = (routesPrefix + fileRelPath).replace(/\/\//g, '/')
    if (routes.has(route)) { continue }
    routes.add(route)

    const fileExtension = path.extname(fileRelPath)

    const contentType = contentTypeDictionary[fileExtension] as string | undefined
    const fileLoader = getLoader(fileExtension)
    const contentDumper = getDumper(fileExtension)

    this.addRawCustomPlugin('GET', route, async (request, reply) => {
      const aclContext = extractAclContext(this, request)
      const manipulatedContent = await fileLoader(fileAbsPath, aclContext.groups, aclContext.permissions)

      const payload = contentDumper(manipulatedContent)

      return reply
        .header('content-type', contentType ?? 'text/plain')
        .code(200)
        .send(payload)
    })
  }
}
