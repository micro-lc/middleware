import { existsSync, readFileSync } from 'fs'

import * as defaults from './defaults'
import type { ContentTypeMap } from './schemas'
import type { EnvironmentVariables } from './schemas/environmentVariablesSchema'

type HeadersMap = Record<`/${string}`, Record<string, string>>;

interface RuntimeConfig extends Required<EnvironmentVariables> {
  CONTENT_TYPE_MAP: ContentTypeMap
  PUBLIC_HEADERS_MAP: HeadersMap
  USER_PROPERTIES_HEADER_KEY: string | undefined
}

const validateContentTypeMap = (contentTypeMap: unknown) => {
  if (contentTypeMap === null || typeof contentTypeMap !== 'object') {
    return defaults.CONTENT_TYPE_MAP
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
    }, defaults.CONTENT_TYPE_MAP)
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

const parseConfig = (config: EnvironmentVariables & Record<string, string>): RuntimeConfig => {
  const { SERVICE_CONFIG_PATH = defaults.SERVICE_CONFIG_PATH } = config
  let serviceConfig: unknown = defaults.PUBLIC_HEADERS_MAP

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
    PUBLIC_DIRECTORY_PATH: config.PUBLIC_DIRECTORY_PATH ?? defaults.PUBLIC_DIRECTORY_PATH,
    PUBLIC_HEADERS_MAP: getPublicHeadersMap(publicHeadersMap),
    RESOURCES_DIRECTORY_PATH: config.RESOURCES_DIRECTORY_PATH ?? defaults.RESOURCES_DIRECTORY_PATH,
    SERVICE_CONFIG_PATH,
    USER_PROPERTIES_HEADER_KEY: config.USER_PROPERTIES_HEADER_KEY,
  }
}

export type { RuntimeConfig }
export { parseConfig }