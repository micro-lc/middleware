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

describe('Serve files', () => {
  const sandbox = createSandbox()

  const index = `
    <!DOCTYPE html>
    <html lang="en">
    <head></head>
    <body>
      <script nonce="**CSP_NONCE**" src="**MICRO_LC_CONFIG_SRC**"></script>
    </body>
    </html>
  `

  let fastify: DecoratedFastify<EnvironmentVariables>
  let cleanup: (() => Promise<unknown>) | undefined

  before(async () => {
    const { name: publicDir, cleanup: pCleanup } = await createTmpDir({
      'index.html': index,
      // 'style.css': style,
    })
    const { name: configPath, cleanup: cpCleanup } = await createConfigFile({
      publicHeadersMap: {
        '/public/index.html': {
          'content-security-policy': [
            ['script-src \'self\' \'nonce-**CSP_NONCE**\''],
          ],
        },
      },
    })

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

  it('should retrieve the index adding the required headers and nonce should be a per-request const', async () => {
    const { payload, headers } = await fastify.inject({
      method: 'GET',
      url: '/public/index.html',
    })

    const indexScript = payload.indexOf('<script ')
    const endline = payload.indexOf('\n', indexScript)
    const line = payload.substring(indexScript, endline)
    const nonce = line.match(/nonce="(?<nonce>[^"]+)"/)?.groups?.nonce as string
    expect(line).to.equal(`<script nonce="${nonce}" src="/configurations/config.json"></script>`)
    expect(headers['content-type']).to.equal('text/html')
    expect(headers['content-security-policy']).to.equal(`script-src 'self' 'nonce-${nonce}'`)

    const { payload: payload2 } = await fastify.inject({
      method: 'GET',
      url: '/public/index.html',
    })

    const indexScript2 = payload2.indexOf('<script ')
    const endline2 = payload2.indexOf('\n', indexScript2)
    const line2 = payload2.substring(indexScript2, endline2)
    const nonce2 = line2.match(/nonce="(?<nonce>[^"]+)"/)?.groups?.nonce as string
    expect(nonce).not.to.be.equal(nonce2)
  })
})
