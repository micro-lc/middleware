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

import type { Config as V1Config } from '@micro-lc/interfaces/v1'

import { expect } from 'chai'

import type { V1AuthConfig } from '../convert-config'
import { convertConfig } from '../convert-config'

describe('Convert configuration', () => {
  it('should convert configuration', () => {
    const iAuth: V1AuthConfig = {
      isAuthNecessary: true,
      userInfoUrl: '/user-info',
      userLogoutUrl: '/user-logout',
    }

    const iConfig = {
      analytics: { disclaimer: 'disclaimer', gtmId: 'gtm_id', privacyLink: 'privacy_link' },
      helpMenu: { helpLink: 'help_link' },
      internalPlugins: [
        {
          aclExpression: 'acl_expression',
          id: 'plugin-internal-iframe',
          integrationMode: 'iframe',
          order: 5,
          pluginRoute: '/internalPlugin1',
          pluginUrl: 'https://example.com/internal-plugin',
        },
      ],
      plugins: [
        {
          aclExpression: 'acl_expression',
          content: [
            {
              category: 'category 1',
              externalLink: { sameWindow: false, url: 'url' },
              icon: 'far fa-window-maximize',
              id: 'href_1',
              integrationMode: 'href',
              label: 'label',
              order: 2,
            },
            {
              aclExpression: 'acl_expression',
              category: 'category 1',
              icon: 'fas fa-asterisk',
              id: 'iframe-1',
              integrationMode: 'iframe',
              label: 'label',
              order: 4,
              pluginRoute: '/iframe',
              pluginUrl: 'https://example.com/iframe',
            },
            {
              icon: 'fab fa-react',
              id: 'compose-1',
              integrationMode: 'qiankun',
              label: 'compose',
              order: 3,
              pluginRoute: '/compose',
              pluginUrl: '/element-composer/',
              props: {
                configurationName: 'configuration_name',
              },
            },
          ],
          icon: 'fas fa-box-open',
          id: 'menu-container',
          label: 'label',
          order: 2,
        },
        {
          icon: 'fas fa-home',
          id: 'qiankun_id_1',
          integrationMode: 'qiankun',
          label: 'label',
          order: 1,
          pluginRoute: '/plugin_route/',
          pluginUrl: '/plugin_url/',
        },
      ],
      theming: {
        header: { favicon: 'favicon', pageTitle: 'page_title' },
        logo: {
          alt: 'alt',
          navigation_url: '/home/',
          url_dark_image: 'url_dark_image',
          url_light_image: 'url_light_image',
        },
        menuLocation: 'topBar',
        variables: { primaryColor: '#de1f92b8' },
      },
    } as unknown as V1Config

    const expectedOutput = {
      applications: {
        'compose-1': {
          config: '/api/v1/microlc/configuration/configuration_name.json',
          integrationMode: 'compose',
          route: '/compose',
        },
        'iframe-1': {
          aclExpression: 'acl_expression',
          integrationMode: 'iframe',
          route: '/iframe',
          src: 'https://example.com/iframe',
        },
        'plugin-internal-iframe': {
          aclExpression: 'acl_expression',
          integrationMode: 'iframe',
          route: '/internalPlugin1',
          src: 'https://example.com/internal-plugin',
        },
        qiankun_id_1: {
          entry: '/plugin_url/',
          integrationMode: 'parcel',
          properties: undefined,
          route: '/plugin_route/',
        },
      },
      layout: {
        content: [
          {
            properties: {
              enableDarkMode: undefined,
              head: {
                favIconUrl: 'favicon',
                title: 'page_title',
              },
              helpMenu: {
                helpHref: 'help_link',
              },
              logo: {
                altText: 'alt',
                onClickHref: '/home/',
                url: {
                  urlDarkImage: 'url_dark_image',
                  urlLightImage: 'url_light_image',
                },
              },
              menuItems: [
                {
                  icon: {
                    library: '@fortawesome/free-solid-svg-icons',
                    selector: 'faHome',
                  },
                  id: 'qiankun_id_1',
                  label: 'label',
                  type: 'application',
                },
                {
                  aclExpression: 'acl_expression',
                  children: [
                    {
                      aclExpression: 'acl_expression',
                      children: [
                        {
                          href: 'url',
                          icon: {
                            library: '@fortawesome/free-regular-svg-icons',
                            selector: 'faWindowMaximize',
                          },
                          id: 'href_1',
                          label: 'label',
                          target: '_blank',
                          type: 'href',
                        },
                        {
                          aclExpression: 'acl_expression',
                          icon: {
                            library: '@fortawesome/free-solid-svg-icons',
                            selector: 'faAsterisk',
                          },
                          id: 'iframe-1',
                          label: 'label',
                          type: 'application',
                        },
                      ],
                      id: 'category_1',
                      label: 'category 1',
                      type: 'group',
                    },
                    {
                      icon: {
                        library: '@fortawesome/free-regular-svg-icons',
                        selector: 'faReact',
                      },
                      id: 'compose-1',
                      label: 'compose',
                      type: 'application',
                    },
                  ],
                  icon: {
                    library: '@fortawesome/free-solid-svg-icons',
                    selector: 'faBoxOpen',
                  },
                  id: 'menu-container',
                  label: 'label',
                  type: 'category',
                },
              ],
              mode: 'topBar',
              userMenu: {
                logout: { redirectUrl: '/user-logout' },
                userInfoUrl: '/user-info',
              },
            },
            tag: 'mlc-layout',
          },
          {
            properties: {
              primaryColor: '#de1f92b8',
              varsPrefix: [
                'micro-lc',
                'microlc',
                'back-kit',
                'ant',
              ],
            },
            tag: 'mlc-antd-theme-manager',
          },
        ],
        sources: [
          'https://cdn.jsdelivr.net/npm/@micro-lc/layout@latest/dist/mlc-layout.js',
          'https://cdn.jsdelivr.net/npm/@micro-lc/layout@latest/dist/mlc-antd-theme-manager.js',
        ],
      },
      settings: {
        defaultUrl: './plugin_route/',
      },
      version: 2,
    }

    const result = convertConfig(iAuth, iConfig, /\/element-(.*)/)
    expect(result).to.deep.equal(expectedOutput)
  })
})
