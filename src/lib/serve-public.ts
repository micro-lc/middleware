/* eslint-disable max-statements */
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

import { randomBytes } from 'crypto'
import { readFileSync } from 'fs'
import { basename, extname } from 'path'

import fastifyStaticPlugin from '@fastify/static'
import type { FastifyReply, FastifyRequest } from 'fastify'

import type { RuntimeConfig } from '../config'
import type { FastifyContext } from '../server'

interface DoneFuncWithErrOrRes {
  (): void
  (err: null, res: unknown): void
}

const NONCE_LENGTH = 24

const nonceGenerator = () => randomBytes(NONCE_LENGTH).toString('base64')

const replaceNonce = (input: string, nonce: string) => input.replace(/\*\*CSP_NONCE\*\*/g, nonce)

const compile = (input: string) => (config: RuntimeConfig, nonce: string) => {
  let content = input
  content = content.replace(/\*\*MICRO_LC_BASE_PATH\*\*/g, config.MICRO_LC_BASE_PATH)
  content = content.replace(/\*\*MICRO_LC_CONFIG_SRC\*\*/g, config.MICRO_LC_CONFIG_SRC)
  content = content.replace(/\*\*MICRO_LC_MODE\*\*/g, config.MICRO_LC_MODE)
  content = content.replace(/\*\*MICRO_LC_VERSION\*\*/g, config.MICRO_LC_VERSION)

  content = replaceNonce(content, nonce)

  return content
}

const staticFileHandler = (config: RuntimeConfig) => (
  request: FastifyRequest,
  reply: FastifyReply,
  payload: {filename: string} & unknown,
  done: DoneFuncWithErrOrRes
) => {
  let { url } = request
  const { statusCode } = reply
  const nonce = nonceGenerator()
  const isPublic = url.startsWith('/public')
  const { PUBLIC_DIRECTORY_PATH, CONTENT_TYPE_MAP: dict, PUBLIC_HEADERS_MAP: phMap } = config

  if (statusCode >= 300 && statusCode < 400) {
    return done()
  }

  // if not found and not public returns
  if (statusCode >= 400 && !isPublic) {
    return done()
  }


  let buffer: unknown = payload
  // if not found and public, attempt to reset to index.html
  if (statusCode > 399 && isPublic) {
    url = `${url}/index.html`
  }

  // extract extension, content-type and extra headers
  let fileExtension = extname(url) as `.${string}` | ''
  let contentType = fileExtension === '' ? undefined : dict[fileExtension] as string | undefined
  let headers = phMap[url as `/${string}`] as Record<string, string> | undefined

  if (isPublic) {
    // move filename when not found
    const filename = reply.statusCode > 399 ? `${PUBLIC_DIRECTORY_PATH}/index.html` : payload.filename

    const name = basename(filename)
    fileExtension = extname(filename) as `.${string}` | ''
    contentType = fileExtension === '' ? undefined : dict[fileExtension] as string | undefined
    headers = phMap[`/public/${name}`] as Record<string, string> | undefined

    let content: string
    try {
      content = readFileSync(filename).toString()
      reply.statusCode = 200
    } catch {
      // leave it as a 404 request
      return done()
    }

    // in case of html, parse variables
    if (filename.endsWith('.html')) {
      content = compile(content)(config, nonce)
    }

    // reset buffer with index.html file
    buffer = Buffer.from(content, 'utf8')
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    reply.header('content-length', (buffer as Buffer).length)
  }

  // set headers and return

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  reply.header('content-type', contentType ?? 'text/plain')

  if (headers) {
    Object.entries(headers).forEach(([key, val]) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      reply.header(key, replaceNonce(val, nonce))
    })
  }

  done(null, buffer)
}

async function registerPublic(this: FastifyContext) {
  const { config: { PUBLIC_DIRECTORY_PATH }, service } = this
  return service.register(
    fastifyStaticPlugin, {
      prefix: '/public',
      prefixAvoidTrailingSlash: true,
      root: PUBLIC_DIRECTORY_PATH,
    }
  )
}

export { registerPublic, staticFileHandler }
