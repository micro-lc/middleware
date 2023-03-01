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

import { expect } from 'chai'

import { parseConfig } from '../config'
import * as defaultConfigs from '../defaults'
import type { EnvironmentVariables } from '../schemas/environmentVariablesSchema'
import { baseVariables, createConfigFile } from '../utils/test-utils'

const createEnvVars = (configPath: string): EnvironmentVariables => ({
  ...baseVariables,
  SERVICE_CONFIG_PATH: configPath,
})

const defaults = {
  CONTENT_TYPE_MAP: defaultConfigs.CONTENT_TYPE_MAP,
  PUBLIC_DIRECTORY_PATH: '/usr/static/public',
  RESOURCES_DIRECTORY_PATH: '/usr/static/configurations',
  USER_PROPERTIES_HEADER_KEY: 'miauserproperties',
}

describe('config injection tests', () => {
  it('should parse an empty configuration', async () => {
    const { name: url, cleanup } = await createConfigFile({})
    const envVars = createEnvVars(url)

    expect(parseConfig(envVars)).to.deep.equal({
      ...defaults,
      PUBLIC_HEADERS_MAP: {},
      SERVICE_CONFIG_PATH: url,
    })

    await cleanup()
  })

  it('should parse a content-type configuration with lowercase key', async () => {
    const { name: url, cleanup } = await createConfigFile({
      contentTypeMap: {
        '.js': 'text/plain',
        '.txt, .pdf': ['text/plain', 'charset=utf-8'],
      },
      publicHeadersMap: {
        '/public/index.html': {
          'Content-Type': [['text/plain', 'charset=utf8']],
        },
      },
    })
    const envVars = createEnvVars(url)

    expect(parseConfig(envVars)).to.deep.equal({
      ...defaults,
      CONTENT_TYPE_MAP: {
        ...defaults.CONTENT_TYPE_MAP,
        '.js': 'text/plain',
        '.pdf': 'text/plain; charset=utf-8',
        '.txt': 'text/plain; charset=utf-8',
      },
      PUBLIC_HEADERS_MAP: {
        '/public/index.html': {
          'content-type': 'text/plain; charset=utf8',
        },
      },
      SERVICE_CONFIG_PATH: url,
    })

    await cleanup()
  })
})
