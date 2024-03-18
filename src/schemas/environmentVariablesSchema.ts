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

import type { FromSchema } from 'json-schema-to-ts'

export const environmentVariablesSchema = {
  additionalProperties: false,
  properties: {
    LANGUAGES_DIRECTORY_PATH: {
      description: 'Absolute path of the directory containing files to be used for translation',
      type: 'string',
    },
    PUBLIC_DIRECTORY_PATH: {
      description: 'Absolute path of the directory containing static files to be served',
      type: 'string',
    },
    RESOURCES_DIRECTORY_PATH: {
      description: 'Absolute path of the directory containing configuration resources to be served',
      type: 'string',
    },
    SERVICE_CONFIG_PATH: {
      description: 'service configuration file absolute path',
      type: 'string',
    },
  },
  required: [],
  type: 'object',
} as const

export type EnvironmentVariables = FromSchema<typeof environmentVariablesSchema>
