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

import path from 'path'

import type { DecoratedFastify } from '@mia-platform/custom-plugin-lib'
import { expect } from 'chai'
import type { LightMyRequestResponse } from 'fastify'
import * as yaml from 'js-yaml'
import type { SinonStub } from 'sinon'
import { createSandbox } from 'sinon'

import type { EnvironmentVariables } from '../../schemas/environmentVariablesSchema'
import * as evaluateAcl from '../../sdk/evaluate-acl'
import * as resolveReferences from '../../sdk/resolve-references'
import { baseVariables, setupFastify } from '../../utils/test-utils'

describe('Serve files', () => {
  const sandbox = createSandbox()

  let evaluateAclStub: SinonStub
  let resolveReferencesStub: SinonStub

  let fastify: DecoratedFastify<EnvironmentVariables>

  before(async () => {
    evaluateAclStub = sandbox.stub(evaluateAcl, 'evaluateAcl').returns({ evaluate: 'acl' })
    resolveReferencesStub = sandbox.stub(resolveReferences, 'resolveReferences').resolves({ resolve: 'references' })

    fastify = await setupFastify({
      CONTENT_TYPE_MAP: JSON.stringify({
        '.special': 'application/damn-special',
      }),
      RESOURCES_DIRECTORY_PATH: path.join(__dirname, './mocks'),
    })
  })

  afterEach(() => sandbox.resetHistory())

  after(async () => {
    await fastify.close()
    sandbox.restore()
  })

  it('should serve only available files', async () => {
    interface TestCase {
      expectedStatusCode: number
      route: string
    }

    const testCases: TestCase[] = [
      { expectedStatusCode: 404, route: '/foo.json' },
      { expectedStatusCode: 404, route: '/.config' },
      { expectedStatusCode: 200, route: '/config' },
      { expectedStatusCode: 200, route: '/config.json' },
      { expectedStatusCode: 200, route: '/config.txt' },
      { expectedStatusCode: 200, route: '/config.yaml' },
      { expectedStatusCode: 200, route: '/config.yml' },
    ]

    let response: LightMyRequestResponse

    for (const { expectedStatusCode, route } of testCases) {
      // eslint-disable-next-line no-await-in-loop
      response = await fastify.inject({ method: 'GET', url: route })
      expect(response.statusCode, route).to.equal(expectedStatusCode)
    }
  })

  it('should serve manipulated .json file', async () => {
    const { payload, headers } = await fastify.inject({
      headers: {
        [baseVariables.GROUPS_HEADER_KEY]: 'admin,user',
        [baseVariables.USER_PROPERTIES_HEADER_KEY]: JSON.stringify({ permissions: ['users.post.write'] }),
      },
      method: 'GET',
      url: '/config.json',
    })

    expect(payload).to.deep.equal(JSON.stringify({ resolve: 'references' }))
    expect(headers['content-type']).to.equal('application/json; charset=utf-8')

    expect(evaluateAclStub.calledOnce).to.be.true
    expect(evaluateAclStub.args[0]).to.deep.equal([{ foo: 'bar' }, ['admin', 'user'], ['users.post.write']])

    expect(resolveReferencesStub.calledOnce).to.be.true
    expect(resolveReferencesStub.args[0]).to.deep.equal([{ evaluate: 'acl' }])
  })

  it('should serve manipulated .yaml file', async () => {
    const { payload, headers } = await fastify.inject({
      headers: {
        [baseVariables.GROUPS_HEADER_KEY]: 'admin,user',
        [baseVariables.USER_PROPERTIES_HEADER_KEY]: JSON.stringify({ permissions: ['users.post.write'] }),
      },
      method: 'GET',
      url: '/config.yaml',
    })

    expect(payload).to.deep.equal(yaml.dump({ resolve: 'references' }))
    expect(headers['content-type']).to.equal('text/yaml; charset=utf-8')

    expect(evaluateAclStub.calledOnce).to.be.true
    expect(evaluateAclStub.args[0]).to.deep.equal([{ foo: 'bar' }, ['admin', 'user'], ['users.post.write']])

    expect(resolveReferencesStub.calledOnce).to.be.true
    expect(resolveReferencesStub.args[0]).to.deep.equal([{ evaluate: 'acl' }])
  })

  it('should serve manipulated .yaml file', async () => {
    const { payload, headers } = await fastify.inject({
      headers: {
        [baseVariables.GROUPS_HEADER_KEY]: 'admin,user',
        [baseVariables.USER_PROPERTIES_HEADER_KEY]: JSON.stringify({ permissions: ['users.post.write'] }),
      },
      method: 'GET',
      url: '/config.yml',
    })

    expect(payload).to.deep.equal(yaml.dump({ resolve: 'references' }))
    expect(headers['content-type']).to.equal('text/yaml; charset=utf-8')

    expect(evaluateAclStub.calledOnce).to.be.true
    expect(evaluateAclStub.args[0]).to.deep.equal([{ foo: 'bar' }, ['admin', 'user'], ['users.post.write']])

    expect(resolveReferencesStub.calledOnce).to.be.true
    expect(resolveReferencesStub.args[0]).to.deep.equal([{ evaluate: 'acl' }])
  })

  it('should remove "definitions" key from manipulated file', async () => {
    resolveReferencesStub.resolves({
      definitions: { ffp: 'bar' },
      resolve: 'references',
    })

    const { payload, headers } = await fastify.inject({
      headers: {
        [baseVariables.GROUPS_HEADER_KEY]: 'admin,user',
        [baseVariables.USER_PROPERTIES_HEADER_KEY]: JSON.stringify({ permissions: ['users.post.write'] }),
      },
      method: 'GET',
      url: '/config.json',
    })

    expect(payload).to.deep.equal(JSON.stringify({ resolve: 'references' }))
    expect(headers['content-type']).to.equal('application/json; charset=utf-8')

    expect(evaluateAclStub.calledOnce).to.be.true
    expect(evaluateAclStub.args[0]).to.deep.equal([{ foo: 'bar' }, ['admin', 'user'], ['users.post.write']])

    expect(resolveReferencesStub.calledOnce).to.be.true
    expect(resolveReferencesStub.args[0]).to.deep.equal([{ evaluate: 'acl' }])
  })

  it('should serve non-JSON file with proper `Content-Type` headers', async () => {
    const { payload, headers } = await fastify.inject({
      method: 'GET',
      url: '/file.special',
    })

    expect(payload).to.deep.equal('')
    expect(headers['content-type']).to.equal('application/damn-special')
  })

  it('should serve unknown files with `text/plain` `Content-Type` headers', async () => {
    const { payload, headers } = await fastify.inject({
      method: 'GET',
      url: '/config',
    })

    expect(payload).to.deep.equal('This file should be served as plain text')
    expect(headers['content-type']).to.equal('text/plain')
  })
})
