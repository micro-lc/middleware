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

import type { Config as V1Config, Plugin as V1Plugin } from '@micro-lc/interfaces/v1'
import type {
  Config as V2Config,
  Component as V2Component,
  ArrayContent as V2ArrayContent,
} from '@micro-lc/interfaces/v2'
import type {
  GroupMenuItem,
  Head,
  HelpMenu,
  Icon,
  Logo,
  MenuItem,
  Mode,
  UserMenu,
} from '@micro-lc/layout/dist/types/web-components/mlc-layout/types'

import type { WithAcl } from '../types'

import type { V1AuthConfig } from './index'

type V1Theming = Exclude<V1Config['theming'], undefined>

const layoutModeMap: Record<Required<V1Theming>['menuLocation'], Mode> = {
  fixedSideBar: 'fixedSideBar',
  sideBar: 'overlaySideBar',
  topBar: 'topBar',
}

const buildLogo = (input: V1Theming['logo']): Logo => {
  const hasDarkLogoUrl = Boolean(input.url_dark_image)
  const url: Logo['url'] = hasDarkLogoUrl
    ? { urlDarkImage: input.url_dark_image as string, urlLightImage: input.url_light_image }
    : input.url_light_image

  return {
    altText: input.alt,
    onClickHref: input.navigation_url,
    url,
  }
}

const buildMenuItemIcon = (input: string | undefined): Icon | undefined => {
  if (!input) { return undefined }

  const inputSegments = input.split(' ')

  return {
    library: inputSegments[0] === 'fas' ? '@fortawesome/free-solid-svg-icons' : '@fortawesome/free-regular-svg-icons',
    selector: inputSegments[1].replace(/-./g, x => x[1].toUpperCase()),
  }
}

const buildMenuItem = (input: WithAcl<V1Plugin>): WithAcl<MenuItem> | undefined => {
  const { aclExpression } = input

  if (input.integrationMode === 'href' && input.externalLink) {
    return {
      ...(aclExpression && { aclExpression }),
      href: input.externalLink.url,
      icon: buildMenuItemIcon(input.icon),
      id: input.id,
      label: input.label,
      target: input.externalLink.sameWindow ? '_self' : '_blank',
      type: 'href',
    }
  }

  if (input.integrationMode === 'qiankun' || input.integrationMode === 'iframe') {
    return {
      ...(aclExpression && { aclExpression }),
      icon: buildMenuItemIcon(input.icon),
      id: input.id,
      label: input.label,
      type: 'application',
    }
  }

  if (input.content) {
    const withoutCategory = input.content.filter(plugin => !plugin.category)
    const categoriesMap: Record<string, V1Plugin[]> = input.content
      .filter(plugin => plugin.category)
      .reduce<Record<string, V1Plugin[]>>((acc, cur) => {
        acc[cur.category as string] = [...acc[cur.category as string] ?? [], cur]
        return acc
      }, {})

    const children: MenuItem[] = []

    Object.keys(categoriesMap).forEach(curKey => {
      const plugins = categoriesMap[curKey]

      const groupChildren: MenuItem[] = []

      plugins.forEach(groupPlugin => {
        const menuItem = buildMenuItem(groupPlugin)
        if (menuItem) { groupChildren.push(menuItem) }
      })

      const group: GroupMenuItem = {
        ...(aclExpression && { aclExpression }),
        children: groupChildren,
        id: curKey.split(' ').join('_'),
        label: curKey,
        type: 'group',
      }

      children.push(group)
    }, children)

    withoutCategory.forEach(plugin => {
      const menuItem = buildMenuItem(plugin)
      if (menuItem) { children.push(menuItem) }
    })

    return {
      ...(aclExpression && { aclExpression }),
      children,
      icon: buildMenuItemIcon(input.icon),
      id: input.id,
      label: input.label,
      type: 'category',
    }
  }

  return undefined
}

const buildHelpMenu = (input: Exclude<V1Config['helpMenu'], undefined>): HelpMenu => {
  return {
    helpHref: input.helpLink,
  }
}

const buildUserMenu = (input: V1AuthConfig): UserMenu | undefined => {
  if (!input.isAuthNecessary || !input.userInfoUrl) { return undefined }

  return {
    logout: { redirectUrl: input.userLogoutUrl },
    userInfoUrl: input.userInfoUrl,
  }
}

const buildHead = (input: Required<V1Theming>['header']): Head => {
  return {
    favIconUrl: input.favicon,
    title: input.pageTitle,
  }
}

const buildSlotContent = (input: V1Config['rightMenu'], accSources: string[]): V2Component | undefined => {
  if (!input || input.length === 0) { return undefined }

  const content: V2ArrayContent = input.map(iContent => {
    const { entry, ...rest } = iContent
    accSources.push(entry)
    return rest as V2Component
  })

  return {
    attributes: { slot: 'top-bar', style: 'display: flex; align-items: center;' },
    content,
    tag: 'div',
  }
}

const buildThemeManager = (iConfig: V1Config, accSources: string[]): V2Component | undefined => {
  if (!iConfig.theming?.variables.primaryColor) { return undefined }

  accSources.push('https://cdn.jsdelivr.net/npm/@micro-lc/layout@latest/dist/mlc-antd-theme-manager.js')

  return {
    properties: {
      primaryColor: iConfig.theming.variables.primaryColor,
      varsPrefix: ['micro-lc', 'microlc', 'back-kit', 'ant'],
    },
    tag: 'mlc-antd-theme-manager',
  }
}

const buildNavigationLayout = (
  iConfig: V1Config,
  iAuth: V1AuthConfig,
  sortedPlugins: V1Plugin[],
  accSources: string[]
): V2Component => {
  const { theming: iTheming, helpMenu: iHelpMenu, rightMenu: iRightMenu } = iConfig

  accSources.push('https://cdn.jsdelivr.net/npm/@micro-lc/layout@latest/dist/mlc-layout.js')

  const slotContent = buildSlotContent(iRightMenu, accSources)

  const menuItems = sortedPlugins.reduce<MenuItem[]>((acc, cur) => {
    const menuItem = buildMenuItem(cur)
    return !menuItem ? acc : [...acc, menuItem]
  }, [])

  return {
    ...(slotContent && { content: slotContent }),
    properties: {
      ...(iTheming?.menuLocation && { mode: layoutModeMap[iTheming.menuLocation] }),
      enableDarkMode: iTheming?.enableDarkMode,
      ...(iTheming?.logo && { logo: buildLogo(iTheming.logo) }),
      menuItems,
      ...(iHelpMenu && { helpMenu: buildHelpMenu(iHelpMenu) }),
      userMenu: buildUserMenu(iAuth),
      ...(iTheming?.header && { head: buildHead(iTheming.header) }),
    },
    tag: 'mlc-layout',
  }
}

export const buildLayout = (iConfig: V1Config, iAuth: V1AuthConfig, sortedPlugins: V1Plugin[]): V2Config['layout'] => {
  const sources: string[] = []
  const content: V2ArrayContent = []

  content.push(buildNavigationLayout(iConfig, iAuth, sortedPlugins, sources))

  const themeManager = buildThemeManager(iConfig, sources)
  themeManager && (content.push(themeManager))

  return { content, sources }
}
