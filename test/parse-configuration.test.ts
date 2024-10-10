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

import type { DecoratedFastify } from '@mia-platform/custom-plugin-lib'
import { expect } from 'chai'

import type { EnvironmentVariables } from '../src/schemas/environmentVariablesSchema'
import { baseVariables, setupFastify } from '../src/utils/test-utils'

const url = '/configurations/parse'

describe('Parse configurations', () => {
  let fastify: DecoratedFastify<EnvironmentVariables>

  before(async () => { fastify = await setupFastify() })

  after(async () => { await fastify.close() })

  it('should proxy body if no parse needed', async () => {
    const input = {
      content: {
        content: [
          { properties: { foo: 'bar' }, tag: 'div' },
          { attributes: { hidden: 'true' }, tag: 'main' },
        ],
        tag: 'div',
      },
      sources: ['source'],
    }

    const { payload, headers } = await fastify.inject({
      body: input,
      headers: {
        [baseVariables.GROUPS_HEADER_KEY]: 'admin,user',
        [baseVariables.USER_PROPERTIES_HEADER_KEY]: JSON.stringify({ permissions: ['users.post.write'] }),
      },
      method: 'POST',
      url,
    })

    expect(payload).to.deep.equal(JSON.stringify(input))
    expect(headers['content-type']).to.equal('application/json; charset=utf-8')
  })

  it('should parse body', async () => {
    const input = {
      content: {
        content: [
          { aclExpression: 'groups.admin', properties: { foo: 'bar' }, tag: 'div' },
          { aclExpression: 'groups.superadmin', attributes: { hidden: 'true' }, tag: 'main' },
          { $ref: '#/definitions/foo' },
        ],
        tag: 'div',
      },
      definitions: {
        foo: 'bar',
      },
      sources: ['source'],
    }

    const expectedOutput = {
      content: {
        content: [
          { properties: { foo: 'bar' }, tag: 'div' },
          'bar',
        ],
        tag: 'div',
      },
      sources: ['source'],
    }

    const { payload, headers } = await fastify.inject({
      body: input,
      headers: {
        [baseVariables.GROUPS_HEADER_KEY]: 'admin,user',
        [baseVariables.USER_PROPERTIES_HEADER_KEY]: JSON.stringify({ permissions: ['users.post.write'] }),
      },
      method: 'POST',
      url: '/configurations/parse',
    })

    expect(payload).to.deep.equal(JSON.stringify(expectedOutput))
    expect(headers['content-type']).to.equal('application/json; charset=utf-8')
  })
})
