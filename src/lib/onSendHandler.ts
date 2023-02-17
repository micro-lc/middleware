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
import { extname } from 'path'

import type { FastifyReply, FastifyRequest } from 'fastify'

import type { FastifyContext } from '../server'

import { configurationsHandler } from './configurations'
import { publicHandler } from './public'

const NONCE_LENGTH = 24

const nonceGenerator = () => randomBytes(NONCE_LENGTH).toString('base64')

const replaceNonce = (input: string, nonce: string) => input.replace(/\*\*CSP_NONCE\*\*/g, nonce)

const isPublic = (url: string): url is `/public${string}` => url.startsWith('/public')

const isConfigurations = (url: string): url is `/configurations/${string}` => url.startsWith('/configurations/')

const staticFileHandler = (context: FastifyContext) => async (
  request: FastifyRequest,
  reply: FastifyReply,
  payload: string | {filename: string},
) => {
  // request context
  let filename = typeof payload === 'string' ? payload : payload.filename
  let { url } = request
  const { statusCode } = reply
  const { config } = context
  const { PUBLIC_DIRECTORY_PATH, CONTENT_TYPE_MAP: dict, PUBLIC_HEADERS_MAP: phMap } = config

  // single nonce
  const nonce = nonceGenerator()
  const injectNonce = (input: string) => replaceNonce(input, nonce)

  // if 304 (or generic not modified)]
  // cache is used and hence no modifications are required
  if (statusCode >= 300 && statusCode < 400) {
    return
  }

  // if not found and not public returns
  if (statusCode >= 400 && !isPublic(url)) {
    return
  // redirect to /public/index.html
  } else if (statusCode >= 400 && isPublic(url)) {
    filename = `${PUBLIC_DIRECTORY_PATH}/index.html`
    url = '/public/index.html'
  }

  let buffer: unknown = payload

  // extract extension, content-type and extra headers
  const fileExtension = extname(filename) as `.${string}` | ''
  const contentType = fileExtension === '' ? undefined : dict[fileExtension] as string | undefined
  const headers = phMap[url as `/${string}`] as Record<string, string> | undefined

  if (isConfigurations(url) && filename) {
    const fileBuffer = await configurationsHandler(request, filename, config)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    reply.header('content-length', fileBuffer.length)
    buffer = fileBuffer
  } else if (isPublic(url)) {
    const fileBuffer = await publicHandler(filename, injectNonce)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    reply.header('content-length', fileBuffer.length)
    buffer = fileBuffer
  } else {
    return
  }


  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  reply.header('content-type', contentType ?? 'text/plain')
  reply.statusCode = 200

  if (headers) {
    Object.entries(headers).forEach(([key, val]) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      reply.header(key, replaceNonce(val, nonce))
    })
  }

  return buffer
}

export { staticFileHandler }
