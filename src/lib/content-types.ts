type Extension = '.json' | '.yml' | '.yaml'

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
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

const validateContentTypeMap = (stringifiedContentTypeMap: string | undefined) => {
  const candidateContentMap = stringifiedContentTypeMap === undefined || stringifiedContentTypeMap.trim() === '' ? '{}' : stringifiedContentTypeMap
  try {
    const contentTypeMap = JSON.parse(candidateContentMap) as unknown

    if (typeof contentTypeMap !== 'object' || contentTypeMap === null || Array.isArray(contentTypeMap)) {
      throw new Error('"CONTENT_TYPE_MAP" is not a valid key/value stringified JSON')
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
  } catch (err) {
    throw new Error('"CONTENT_TYPE_MAP" is not a valid stringified JSON')
  }
}

export { validateContentTypeMap }
