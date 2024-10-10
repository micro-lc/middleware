import { existsSync, statSync } from 'fs'
import path from 'path'

import fastifyAcceptsPlugin from '@fastify/accepts'
import fastifyStaticPlugin from '@fastify/static'

import type { FastifyContext } from '../server'

import parseConfigurationHandler from './parseConfigurationHandler'

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

async function registerConfigurations(this: FastifyContext) {
  const { config: { RESOURCES_DIRECTORY_PATH }, service } = this

  service.addRawCustomPlugin('POST', '/configurations/parse', parseConfigurationHandler(this))

  service.addRawCustomPlugin('GET', '/configurations/*', async (request, reply) => {
    const { url } = request
    const filename = path.join(RESOURCES_DIRECTORY_PATH, url.replace(/^\/configurations/, ''))
    if (existsSync(filename) && statSync(filename).isFile()) {
      reply.statusCode = 200
      return filename
    }

    return reply.callNotFound()
  })

  return service.register(fastifyAcceptsPlugin)
}

export { registerConfigurations, registerPublic }
