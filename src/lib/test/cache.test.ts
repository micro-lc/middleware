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

import { createConfigFile, createTmpDir, setupFastify } from '../../utils/test-utils'

describe('cache tests', () => {
  it('should retrieve the style and returns a 304 on next request', async () => {
    const style = `
    body {
      margin: 0;
    }
  `

    const { name: publicDir, cleanup: pCleanup } = await createTmpDir({
      'style.css': style,
    })
    const { name: configPath, cleanup: cpCleanup } = await createConfigFile({})

    const cleanup = () => Promise.all([pCleanup(), cpCleanup()])

    const fastify = await setupFastify({
      PUBLIC_DIRECTORY_PATH: publicDir,
      SERVICE_CONFIG_PATH: configPath,
    })
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

    await fastify.close()
    await cleanup()
  })
})
