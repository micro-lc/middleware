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

import type { DecoratedFastify } from '@mia-platform/custom-plugin-lib'
import { expect } from 'chai'
import { createSandbox } from 'sinon'

import type { EnvironmentVariables } from '../../schemas/environmentVariablesSchema'
import { createConfigFile, createTmpDir, setupFastify } from '../../utils/test-utils'

describe('cache tests', () => {
  const sandbox = createSandbox()

  const style = `
    body {
      margin: 0;
    }
  `

  let fastify: DecoratedFastify<EnvironmentVariables>
  let cleanup: (() => Promise<unknown>) | undefined

  before(async () => {
    const { name: publicDir, cleanup: pCleanup } = await createTmpDir({
      'style.css': style,
    })
    const { name: configPath, cleanup: cpCleanup } = await createConfigFile({})

    cleanup = () => Promise.all([pCleanup(), cpCleanup()])

    fastify = await setupFastify({
      PUBLIC_DIRECTORY_PATH: publicDir,
      SERVICE_CONFIG_PATH: configPath,
    })
  })

  afterEach(() => sandbox.resetHistory())

  after(async () => {
    await fastify.close()
    await cleanup?.()
    sandbox.restore()
  })

  it('should retrieve the style and returns a 304 on next request', async () => {
    const { payload, headers: { 'last-modified': lastModified, etag } } = await fastify.inject({
      method: 'GET',
      url: '/public/style.css',
    })

    expect(payload).to.equal(style)

    const { statusCode } = await fastify.inject({
      headers: {
        'cache-control': 'max-age=0',
        'if-modified-since': lastModified,
        'if-none-match': etag,
      },
      method: 'GET',
      url: '/public/style.css',
    })
    expect(statusCode).to.equal(304)
  })
})
