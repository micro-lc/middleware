import type { Config as V1Config, InternalPlugin as V1InternalPlugin, Plugin as V1Plugin } from '@micro-lc/interfaces/v1'
import type {
  Application as V2Application,
  ComposableApplication2,
  Config as V2Config,
  ParcelApplication2,
} from '@micro-lc/interfaces/v2'

import type { WithAcl } from '../types'

const convertQiankunPlugin = (
  input: WithAcl<V1Plugin> | WithAcl<V1InternalPlugin>,
  elementComposerUrlRegex?: RegExp
): WithAcl<ParcelApplication2> | WithAcl<ComposableApplication2> => {
  const { pluginRoute, pluginUrl, props, aclExpression } = input

  const isComposableApplication = Boolean(
    elementComposerUrlRegex
    && pluginUrl?.match(elementComposerUrlRegex)
    && props?.configurationName
  )

  if (isComposableApplication) {
    return {
      ...(aclExpression && { aclExpression }),
      config: `./api/v1/microlc/configuration/${props?.configurationName as string}.json`,
      integrationMode: 'compose',
      route: pluginRoute as string,
    }
  }

  return {
    ...(aclExpression && { aclExpression }),
    entry: pluginUrl as string,
    integrationMode: 'parcel',
    properties: props,
    route: pluginRoute as string,
  }
}

const pluginToApplication = (
  input: WithAcl<V1Plugin> | WithAcl<V1InternalPlugin>,
  elementComposerUrlRegex?: RegExp
): WithAcl<V2Application> | undefined => {
  const { integrationMode, pluginRoute, pluginUrl, aclExpression } = input

  if (!pluginUrl || !pluginRoute) { return undefined }

  switch (integrationMode) {
  case 'qiankun': {
    return convertQiankunPlugin(input, elementComposerUrlRegex)
  }
  case 'iframe': {
    return {
      ...(aclExpression && { aclExpression }),
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

const applicationsIterator = (
  acc: Exclude<V2Config['applications'], undefined>,
  plugin: V1Plugin | V1InternalPlugin,
  elementComposerUrlRegex?: RegExp
) => {
  if (plugin.integrationMode) {
    const application = pluginToApplication(plugin, elementComposerUrlRegex)
    if (application) { acc[plugin.id] = application }
    return
  }

  if ((plugin as V1Plugin).content) {
    (plugin as V1Plugin).content!.forEach(subPlugin => { applicationsIterator(acc, subPlugin, elementComposerUrlRegex) })
  }
}

export const buildApplications = (input: V1Config, elementComposerUrlRegex?: RegExp): V2Config['applications'] => {
  const { plugins: iPlugins = [], internalPlugins: iInternalPlugins = [] } = input

  const applications: Exclude<V2Config['applications'], undefined> = {}

  iInternalPlugins.forEach(plugin => { applicationsIterator(applications, plugin, elementComposerUrlRegex) })
  iPlugins.forEach(plugin => { applicationsIterator(applications, plugin, elementComposerUrlRegex) })

  return applications
}
