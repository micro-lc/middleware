import type { Config as V1Config, InternalPlugin as V1InternalPlugin, Plugin as V1Plugin } from '@micro-lc/interfaces/v1'
import type { Application as V2Application, Config as V2Config } from '@micro-lc/interfaces/v2'

const pluginToApplication = (input: V1Plugin | V1InternalPlugin): V2Application | undefined => {
  const { integrationMode, pluginRoute, pluginUrl, props } = input

  if (!pluginUrl || !pluginRoute) { return undefined }

  switch (integrationMode) {
  // TODO: should separate compose app?
  case 'qiankun': {
    return {
      entry: pluginUrl,
      integrationMode: 'parcel',
      properties: props,
      route: pluginRoute,
    }
  }
  case 'iframe': {
    return {
      integrationMode: 'iframe',
      route: pluginRoute,
      src: pluginUrl,
    }
  }
  case 'href':
  default:
    return undefined
  }
}

const applicationsIterator = (acc: Exclude<V2Config['applications'], undefined>, plugin: V1Plugin | V1InternalPlugin) => {
  if (plugin.integrationMode) {
    const application = pluginToApplication(plugin)
    if (application) { acc[plugin.id] = application }
    return
  }

  if ((plugin as V1Plugin).content) {
    (plugin as V1Plugin).content!.forEach(subPlugin => { applicationsIterator(acc, subPlugin) })
  }
}

export const buildApplications = (input: V1Config): V2Config['applications'] => {
  const { plugins: iPlugins = [], internalPlugins: iInternalPlugins = [] } = input

  const applications: Exclude<V2Config['applications'], undefined> = {}

  iInternalPlugins.forEach(plugin => { applicationsIterator(applications, plugin) })
  iPlugins.forEach(plugin => { applicationsIterator(applications, plugin) })

  return applications
}
