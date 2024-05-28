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

/* eslint-disable @typescript-eslint/require-await */
import { expect } from 'chai'

import type { AclContextBuilderFunction, RuntimeConfig } from '../../config'
import { extractAclContext } from '../extract-acl-context'

describe('Extract Acl Context', () => {
  const config: RuntimeConfig = {
    ACL_CONTEXT_BUILDER: undefined,
    ACL_CONTEXT_BUILDER_PATH: '',
    CONTENT_TYPE_MAP: {},
    LANGUAGES_CONFIG: [],
    LANGUAGES_DIRECTORY_PATH: '',
    PUBLIC_DIRECTORY_PATH: '',
    PUBLIC_HEADERS_MAP: {},
    RESOURCES_DIRECTORY_PATH: '',
    SERVICE_CONFIG_PATH: '',
    USER_PROPERTIES_HEADER_KEY: 'userproperties',
  }

  const request = {
    getGroups: () => ['admin', 'dev'],
    headers: {
      userproperties: JSON.stringify({ permissions: ['read-file'] }),
    },
  }

  interface Test {
    aclContextBuilder?: AclContextBuilderFunction
    expected: string[]
    message: string
  }

  const tests: Test[] = [
    {
      expected: ['groups.admin', 'groups.dev', 'permissions.read-file'],
      message: 'Get context from headers',
    },
    {
      // @ts-expect-error needed for test
      aclContextBuilder: async () => ({ unknown: 'value' }),
      expected: [],
      message: 'Custom function does NOT return an array',
    },
    {
      // @ts-expect-error needed for test
      aclContextBuilder: async () => [{ foo: 'bar' }, ['something']],
      expected: [],
      message: 'Custom function returns an array of NON-strings',
    },
    {
      aclContextBuilder: async () => ['something'],
      expected: ['something'],
      message: 'Custom function returns an array of strings',
    },
  ]

  tests.forEach(({ aclContextBuilder, expected, message }, index) => {
    it(`#${index} - ${message}`, async () => {
      const testConfig: RuntimeConfig = {
        ...config,
        ACL_CONTEXT_BUILDER: aclContextBuilder,
      }

      // @ts-expect-error request is incomplete for test purposes
      const result = await extractAclContext(testConfig, request)
      expect(result).to.deep.equal(expected)
    })
  })
})
