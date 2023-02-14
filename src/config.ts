import { existsSync, readFileSync } from 'fs'

import type { ContentTypeMap } from './schemas'
import type { EnvironmentVariables } from './schemas/environmentVariablesSchema'

type HeadersMap = Record<`/${string}`, Record<string, string>>;

interface RuntimeConfig {
  CONTENT_TYPE_MAP: ContentTypeMap
  MICRO_LC_BASE_PATH: string
  MICRO_LC_CONFIG_SRC: string
  MICRO_LC_MODE: string
  MICRO_LC_VERSION: string
  PUBLIC_DIRECTORY_PATH: string
  PUBLIC_HEADERS_MAP: HeadersMap
  RESOURCES_DIRECTORY_PATH: string
  SERVICE_CONFIG_PATH: string
}

type Extension = '.json' | '.yml' | '.yaml'

const DEFAULT_CONTENT_TYPE_MAP: Record<Extension | string, string> = {
  '.cjs': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'application/javascript',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
}

const validateContentTypeMap = (contentTypeMap: unknown) => {
  if (contentTypeMap === null || typeof contentTypeMap !== 'object') {
    return DEFAULT_CONTENT_TYPE_MAP
  }

  return Object.entries(contentTypeMap)
    .reduce<Record<string, string>>((dict, [key, value]) => {
      if (typeof value !== 'string') {
        return dict
      }

      return Object.assign(dict, key.split(',').reduce<Record<string, string>>((acc, ext) => {
        const trimmedExtension = ext.trim()
        if (trimmedExtension.startsWith('.')) {
          acc[trimmedExtension] = value
        }
        return acc
      }, dict))
    }, DEFAULT_CONTENT_TYPE_MAP)
}

const getHeaderDictionary = (obj: object): Record<string, string> =>
  Object.entries(obj).reduce<Record<string, string>>((acc, [key, val]) => {
    if (typeof val === 'string') {
      acc[key.toLowerCase()] = val
    } else if (Array.isArray(val)) {
      acc[key.toLowerCase()] = val.reduce<string[]>((header, entry) => {
        if (typeof entry === 'string') {
          header.push(entry)
        } else if (Array.isArray(entry)) {
          header.push((entry as unknown as string[]).join('; '))
        }

        return header
      }, []).join(', ')
    }

    return acc
  }, {})

const getPublicHeadersMap = (input: unknown): HeadersMap => {
  const publicHeadersMap: HeadersMap = {}

  if (input !== null && typeof input === 'object') {
    return Object.entries(input).reduce((acc, [key, val]) => {
      if (key.startsWith('/public/') && val !== null && typeof val === 'object') {
        acc[key as `/public/${string}`] = getHeaderDictionary(val as object)
      }

      return acc
    }, publicHeadersMap)
  }

  return publicHeadersMap
}

const DEFAULT_RESOURCES_DIRECTORY_PATH = '/usr/static/configurations'

const DEFAULT_PUBLIC_DIRECTORY_PATH = '/usr/static/public'

const DEFAULT_SERVICE_CONFIG_PATH = '/usr/src/app/config.json'

const parseConfig = (config: EnvironmentVariables): RuntimeConfig => {
  const { SERVICE_CONFIG_PATH = DEFAULT_SERVICE_CONFIG_PATH } = config
  let serviceConfig: unknown = {}

  let configPath: string | undefined
  try {
    if (existsSync(SERVICE_CONFIG_PATH)) {
      configPath = SERVICE_CONFIG_PATH
    }
  } catch {
    /* no-op */
  }

  if (configPath !== undefined) {
    try {
      serviceConfig = JSON.parse(readFileSync(configPath).toString()) as unknown
    } catch (err) {
      throw new Error(`${SERVICE_CONFIG_PATH} is not a valid configuration${err instanceof Error ? err.message : ''}`)
    }
  }

  let contentTypeMap: unknown
  let publicHeadersMap: unknown
  if (serviceConfig !== null && typeof serviceConfig === 'object') {
    contentTypeMap = 'contentTypeMap' in serviceConfig ? serviceConfig.contentTypeMap : undefined
    publicHeadersMap = 'publicHeadersMap' in serviceConfig ? serviceConfig.publicHeadersMap : undefined
  }

  return {
    CONTENT_TYPE_MAP: validateContentTypeMap(contentTypeMap),
    MICRO_LC_BASE_PATH: config.MICRO_LC_BASE_PATH ?? '/',
    MICRO_LC_CONFIG_SRC: config.MICRO_LC_CONFIG_SRC ?? '/configurations/config.json',
    MICRO_LC_MODE: config.MICRO_LC_MODE ?? 'production',
    MICRO_LC_VERSION: config.MICRO_LC_VERSION ?? 'latest',
    PUBLIC_DIRECTORY_PATH: config.PUBLIC_DIRECTORY_PATH ?? DEFAULT_PUBLIC_DIRECTORY_PATH,
    PUBLIC_HEADERS_MAP: getPublicHeadersMap(publicHeadersMap),
    RESOURCES_DIRECTORY_PATH: config.RESOURCES_DIRECTORY_PATH ?? DEFAULT_RESOURCES_DIRECTORY_PATH,
    SERVICE_CONFIG_PATH,
  }
}

export type { RuntimeConfig }
export { parseConfig, DEFAULT_CONTENT_TYPE_MAP }
