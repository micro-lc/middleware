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

type FileLoader = (fileAbsPath: string) => Promise<Json>
type JsonDumper = (json: Json) => unknown

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

const loadJsonFile: FileLoader = async fileAbsPath => {
  const rawContent = await fs.promises.readFile(fileAbsPath, 'utf-8')
  return JSON.parse(rawContent) as Json
}

const loadYamlFile: FileLoader = async fileAbsPath => {
  const rawContent = await fs.promises.readFile(fileAbsPath, 'utf-8')
  return yaml.load(rawContent) as Json
}

const manipulateJson = async (json: Json, aclGroups: string[], aclPermissions: string[]): Promise<Json> => {
  const filteredContent = evaluateAcl(json, aclGroups, aclPermissions)
  const resolvedJson = await resolveReferences(filteredContent)

  if (resolvedJson && typeof resolvedJson === 'object' && 'definitions' in resolvedJson) {
    delete (resolvedJson as { definitions?: unknown }).definitions
  }

  return resolvedJson
}

const dumpToJson: JsonDumper = json => json

const dumpToYaml: JsonDumper = json => yaml.dump(json)

export async function registerRoutes(this: DecoratedFastify<EnvironmentVariables>) {
  const { RESOURCES_DIRECTORY_PATH } = this.config

  validateResourcesDirectoryPath(RESOURCES_DIRECTORY_PATH)

  const winSeparatorRegex = new RegExp(`\\${path.win32.sep}`, 'g')
  const globPattern = path
    .join(RESOURCES_DIRECTORY_PATH, '**/*.{json,yml,yaml}')
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

    const contentType = `${fileExtension === '.json' ? 'application/json' : 'text/yaml'}; charset=utf-8`
    const fileLoader = fileExtension === '.json' ? loadJsonFile : loadYamlFile
    const contentDumper = fileExtension === '.json' ? dumpToJson : dumpToYaml

    this.addRawCustomPlugin('GET', route, async (request, reply) => {
      const json = await fileLoader(fileAbsPath)

      const aclContext = extractAclContext(this, request)
      const manipulatedJson = await manipulateJson(json, aclContext.groups, aclContext.permissions)

      const payload = contentDumper(manipulatedJson)

      return reply
        .header('content-type', contentType)
        .code(200)
        .send(payload)
    })
  }
}
