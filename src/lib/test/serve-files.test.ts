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

import { randomUUID } from 'crypto'

import type { DecoratedFastify } from '@mia-platform/custom-plugin-lib'
import { expect } from 'chai'
import type { LightMyRequestResponse } from 'fastify'
import * as yaml from 'js-yaml'
import type { SinonStub } from 'sinon'
import { createSandbox } from 'sinon'

import type { EnvironmentVariables } from '../../schemas/environmentVariablesSchema'
import * as evaluateAcl from '../../sdk/evaluate-acl'
import * as resolveReferences from '../../sdk/resolve-references'
import { baseVariables, createConfigFile, createTmpDir, setupFastify } from '../../utils/test-utils'

describe('Serve files', () => {
  const sandbox = createSandbox()

  let evaluateAclStub: SinonStub
  let resolveReferencesStub: SinonStub
  let random: string

  let fastify: DecoratedFastify<EnvironmentVariables>
  let cleanup: (() => Promise<unknown>) | undefined

  before(async () => {
    evaluateAclStub = sandbox.stub(evaluateAcl, 'evaluateAcl').returns({ evaluate: 'acl' })
    resolveReferencesStub = sandbox.stub(resolveReferences, 'resolveReferences').resolves({ resolve: 'references' })
    random = randomUUID()
    const { name: configurations, cleanup: confCleanup } = await createTmpDir({
      '.config': random,
      config: random,
      'config.json': JSON.stringify({ foo: 'bar' }),
      'config.txt': '',
      'config.yaml': 'foo: bar',
      'file-to-parse.json': JSON.stringify({ foo: { aclExpression: 'false', test: true } }),
      'file.special': random,
    })
    const { name: configPath, cleanup: cpCleanup } = await createConfigFile({
      contentTypeMap: {
        '.special': 'application/damn-special',
      },
    })

    cleanup = () => Promise.all([confCleanup(), cpCleanup()])

    fastify = await setupFastify({
      RESOURCES_DIRECTORY_PATH: configurations,
      SERVICE_CONFIG_PATH: configPath,
    })
  })

  afterEach(() => sandbox.resetHistory())

  after(async () => {
    await fastify.close()
    await cleanup?.()
    sandbox.restore()
  })

  interface TestCase {
    expectedStatusCode: number
    route: string
  }

  const testCases: TestCase[] = [
    { expectedStatusCode: 404, route: '/foo.json' },
    { expectedStatusCode: 404, route: '/configurations/foo.json' },
    { expectedStatusCode: 200, route: '/configurations/.config' },
    { expectedStatusCode: 200, route: '/configurations/config' },
    { expectedStatusCode: 200, route: '/configurations/config.json' },
    { expectedStatusCode: 200, route: '/configurations/config.txt' },
    { expectedStatusCode: 200, route: '/configurations/config.yaml' },
    { expectedStatusCode: 404, route: '/configurations/config.yml' },
  ]

  for (const { expectedStatusCode, route } of testCases) {
    const message = `should return status ${expectedStatusCode} when fetching route ${route}`
    // eslint-disable-next-line no-loop-func
    it(`serve only available files: ${message}`, async () => {
      const response: LightMyRequestResponse = await fastify.inject({ method: 'GET', url: route })
      expect(response.statusCode, route).to.equal(expectedStatusCode)
    })
  }

  it('should serve manipulated .json file', async () => {
    const { payload, headers } = await fastify.inject({
      headers: {
        [baseVariables.GROUPS_HEADER_KEY]: 'admin,user',
        [baseVariables.USER_PROPERTIES_HEADER_KEY]: JSON.stringify({ permissions: ['users.post.write'] }),
      },
      method: 'GET',
      url: '/configurations/config.json',
    })

    expect(payload).to.deep.equal(JSON.stringify({ resolve: 'references' }))
    expect(headers['content-type']).to.equal('application/json')

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
      url: '/configurations/config.yaml',
    })

    expect(payload).to.deep.equal(yaml.dump({ resolve: 'references' }))
    expect(headers['content-type']).to.equal('text/yaml')

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
      url: '/configurations/config.yaml',
    })

    expect(payload).to.deep.equal(yaml.dump({ resolve: 'references' }))
    expect(headers['content-type']).to.equal('text/yaml')

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
      url: '/configurations/config.json',
    })

    expect(payload).to.deep.equal(JSON.stringify({ resolve: 'references' }))
    expect(headers['content-type']).to.equal('application/json')

    expect(evaluateAclStub.calledOnce).to.be.true
    expect(evaluateAclStub.args[0]).to.deep.equal([{ foo: 'bar' }, ['admin', 'user'], ['users.post.write']])

    expect(resolveReferencesStub.calledOnce).to.be.true
    expect(resolveReferencesStub.args[0]).to.deep.equal([{ evaluate: 'acl' }])
  })

  it('should serve non-JSON file with proper `Content-Type` headers', async () => {
    const { payload, headers } = await fastify.inject({
      method: 'GET',
      url: '/configurations/file.special',
    })

    expect(payload).to.deep.equal(random)
    expect(headers['content-type']).to.equal('application/damn-special')
  })

  it('should manipulate an ACL expression', async () => {
    const { payload } = await fastify.inject({
      method: 'GET',
      url: '/configurations/file-to-parse.json',
    })

    expect(payload).to.deep.equal(JSON.stringify({ resolve: 'references' }))
  })

  it('should serve unknown files with `text/plain` `Content-Type` headers', async () => {
    const { payload, headers } = await fastify.inject({
      method: 'GET',
      url: '/configurations/config',
    })

    expect(payload).to.deep.equal(random)
    expect(headers['content-type']).to.equal('text/plain')
  })
})
