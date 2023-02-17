type Extension = '.json' | '.yml' | '.yaml'

const RESOURCES_DIRECTORY_PATH = '/usr/static/configurations'

const PUBLIC_DIRECTORY_PATH = '/usr/static/public'

const SERVICE_CONFIG_PATH = '/usr/src/app/config/config.json'

const PUBLIC_HEADERS_MAP = {}

const CONTENT_TYPE_MAP: Record<Extension | string, string> = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
}

export {
  CONTENT_TYPE_MAP,
  RESOURCES_DIRECTORY_PATH,
  SERVICE_CONFIG_PATH,
  PUBLIC_DIRECTORY_PATH,
  PUBLIC_HEADERS_MAP,
}
