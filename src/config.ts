import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from 'fs'
import path from 'path'

import * as defaults from './defaults'
import type { ContentTypeMap } from './schemas'
import type { EnvironmentVariables } from './schemas/environmentVariablesSchema'

type HeadersMap = Record<`/${string}`, Record<string, string>>;

interface LanguageConfig {
  labelsMap: Record<string, unknown>
  languageId: string
}

interface AclContextBuilderInput {
  headers: Record<string, string | string[] | undefined>
  method: string
  pathParams: unknown
  queryParams: unknown
  url: string
}

export type AclContextBuilderFunction = (input: AclContextBuilderInput) => string[]

interface RuntimeConfig extends Required<EnvironmentVariables> {
  ACL_CONTEXT_BUILDER: AclContextBuilderFunction | undefined
  CONTENT_TYPE_MAP: ContentTypeMap
  LANGUAGES_CONFIG: LanguageConfig[]
  PUBLIC_HEADERS_MAP: HeadersMap
  USER_PROPERTIES_HEADER_KEY: string | undefined
}

const validateLanguages = (languageDirPath: string): LanguageConfig[] => {
  if (!existsSync(languageDirPath)) {
    return []
  }

  const languageFilepaths = readdirSync(languageDirPath)
    .map(filename => path.join(languageDirPath, filename))
    .filter(filepath => lstatSync(realpathSync(filepath)).isFile())
  return languageFilepaths.map((filepath) => {
    const fileContent = JSON.parse(readFileSync(filepath).toString()) as unknown
    if (!fileContent
      || typeof fileContent !== 'object'
      || Array.isArray(fileContent)) {
      throw new Error(`${filepath} is not a valid language configuration`)
    }

    return {
      labelsMap: fileContent as Record<string, unknown>,
      languageId: path.basename(filepath, '.json'),
    }
  })
}

const validateContentTypeMap = (contentTypeMap: unknown) => {
  if (contentTypeMap === null || typeof contentTypeMap !== 'object') {
    return defaults.CONTENT_TYPE_MAP
  }

  return Object.entries(contentTypeMap)
    .reduce<Record<string, string>>((dict, [key, value]) => {
      if (!(typeof value === 'string' || Array.isArray(value))) {
        return dict
      }

      return Object.assign(dict, key.split(',').reduce<Record<string, string>>((acc, ext) => {
        const trimmedExtension = ext.trim()
        if (trimmedExtension.startsWith('.')) {
          acc[trimmedExtension] = typeof value === 'string' ? value : value.reduce<string[]>((contentType, entry) => {
            if (typeof entry === 'string') {
              contentType.push(entry)
            }
            return contentType
          }, []).join('; ')
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

const getAclContextBuilder = async (aclContextBuilderPath: string): Promise<AclContextBuilderFunction | undefined> => {
  if (!existsSync(aclContextBuilderPath)) {
    return undefined
  }
  try {
    const content = readFileSync(aclContextBuilderPath).toString('base64')
    const { default: aclContextBuilder } = await import(`data:text/javascript;base64,${content}`) as {default:AclContextBuilderFunction}
    return aclContextBuilder
  } catch (err) {
    throw new Error(`${aclContextBuilderPath} is not a valid script ${err instanceof Error ? err.message : ''}`)
  }
}

const parseConfig = async (config: EnvironmentVariables & Record<string, string>): Promise<RuntimeConfig> => {
  const {
    ACL_CONTEXT_BUILDER_PATH = defaults.ACL_CONTEXT_BUILDER_PATH,
    LANGUAGES_DIRECTORY_PATH = defaults.LANGUAGES_DIRECTORY_PATH,
    SERVICE_CONFIG_PATH = defaults.SERVICE_CONFIG_PATH,
  } = config
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
    ACL_CONTEXT_BUILDER: await getAclContextBuilder(ACL_CONTEXT_BUILDER_PATH),
    ACL_CONTEXT_BUILDER_PATH,
    CONTENT_TYPE_MAP: validateContentTypeMap(contentTypeMap),
    LANGUAGES_CONFIG: validateLanguages(LANGUAGES_DIRECTORY_PATH),
    LANGUAGES_DIRECTORY_PATH,
    PUBLIC_DIRECTORY_PATH: config.PUBLIC_DIRECTORY_PATH ?? defaults.PUBLIC_DIRECTORY_PATH,
    PUBLIC_HEADERS_MAP: getPublicHeadersMap(publicHeadersMap),
    RESOURCES_DIRECTORY_PATH: config.RESOURCES_DIRECTORY_PATH ?? defaults.RESOURCES_DIRECTORY_PATH,
    SERVICE_CONFIG_PATH,
    USER_PROPERTIES_HEADER_KEY: config.USER_PROPERTIES_HEADER_KEY,
  }
}

export type { LanguageConfig, RuntimeConfig }
export { parseConfig }
