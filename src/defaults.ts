type Extension = '.json' | '.yml' | '.yaml'

const RESOURCES_DIRECTORY_PATH = '/usr/static/configurations'

const PUBLIC_DIRECTORY_PATH = '/usr/static/public'

const LANGUAGES_DIRECTORY_PATH = '/usr/static/languages'

const SERVICE_CONFIG_PATH = '/usr/src/app/config/config.json'

const ACL_CONTEXT_BUILDER_PATH = '/usr/src/app/config/acl-context-builder.js'

const PUBLIC_HEADERS_MAP = {}

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
const CONTENT_TYPE_MAP: Record<Extension | string, string> = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
}

const ENABLE_CACHE = 'true'

export {
  ACL_CONTEXT_BUILDER_PATH,
  CONTENT_TYPE_MAP,
  RESOURCES_DIRECTORY_PATH,
  SERVICE_CONFIG_PATH,
  PUBLIC_DIRECTORY_PATH,
  PUBLIC_HEADERS_MAP,
  LANGUAGES_DIRECTORY_PATH,
  ENABLE_CACHE,
}
