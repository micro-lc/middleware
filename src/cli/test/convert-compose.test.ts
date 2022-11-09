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

import type { PluginConfiguration as V2Plugin } from '@micro-lc/interfaces/v2'

import { expect } from 'chai'

import type { V1Compose, V2PluginWithRef } from '../convert-compose'
import { convertCompose } from '../convert-compose'

describe('Convert compose configuration', () => {
  it('should convert configuration without $ref', () => {
    const input = {
      attributes: { style: 'height: 100%;' },
      content: [
        {
          properties: { customProperty: 'custom-property' },
          tag: 'custom-element-1',
          type: 'element',
          url: '/custom-element-1',
        },
        {
          attributes: { style: 'width: 100%' },
          content: [
            {
              attributes: { style: 'align-items: center;' },
              content: [
                {
                  attributes: { style: 'margin: 0 1vw 0 0;' },
                  properties: { content: { en: 'foo', it: 'bar' } },
                  tag: 'custom-element-2',
                  type: 'element',
                },
                { tag: 'custom-element-3', type: 'element' },
              ],
              type: 'column',
            },
            {
              attributes: { style: 'align-items: center;' },
              content: [
                {
                  properties: { boolProp: true },
                  tag: 'custom-element-4',
                  type: 'element',
                  url: '/custom-element-4',
                },
              ],
              type: 'column',
            },
          ],
          type: 'column',
        },
        {
          attributes: { style: 'flex-grow: 1; position:relative; bottom: 0;' },
          content: [],
          type: 'row',
        },
      ],
      type: 'row',
    }

    const expectedOutput: V2Plugin = {
      content: {
        attributes: { style: 'display: flex; flex-direction: column; height: 100%;' },
        content: [
          {
            attributes: {},
            content: undefined,
            properties: { customProperty: 'custom-property' },
            tag: 'custom-element-1',
          },
          {
            attributes: { style: 'display: flex; flex-direction: row; width: 100%' },
            content: [
              {
                attributes: { style: 'display: flex; flex-direction: row; align-items: center;' },
                content: [
                  {
                    attributes: { style: 'margin: 0 1vw 0 0;' },
                    content: undefined,
                    properties: { content: { en: 'foo', it: 'bar' } },
                    tag: 'custom-element-2',
                  },
                  { attributes: {}, content: undefined, tag: 'custom-element-3' },
                ],
                tag: 'div',
              },
              {
                attributes: { style: 'display: flex; flex-direction: row; align-items: center;' },
                content: [
                  {
                    attributes: {},
                    content: undefined,
                    properties: { boolProp: true },
                    tag: 'custom-element-4',
                  },
                ],
                tag: 'div',
              },
            ],
            tag: 'div',
          },
          {
            attributes: { style: 'display: flex; flex-direction: column; flex-grow: 1; position:relative; bottom: 0;' },
            content: [],
            tag: 'div',
          },
        ],
        tag: 'div',
      },
      sources: ['/custom-element-1', '/custom-element-4'],
    }

    const result = convertCompose(input as unknown as V1Compose)
    expect(result).to.deep.equal(expectedOutput)
  })

  it('should convert configuration with $ref', () => {
    const input = {
      $ref: {
        schema: {
          properties: { foo: { type: 'string' } },
          type: 'object',
        },
        string: 'foo',
      },
      content: {
        attributes: { style: 'height: 100%;' },
        content: [
          {
            properties: { customProperty: 'custom-property' },
            tag: 'custom-element-1',
            type: 'element',
            url: '/custom-element-1',
          },
          {
            attributes: { style: 'width: 100%' },
            content: [
              {
                attributes: { style: 'align-items: center;' },
                content: [
                  {
                    attributes: { style: 'margin: 0 1vw 0 0;' },
                    properties: { content: { en: 'foo', it: 'bar' } },
                    tag: 'custom-element-2',
                    type: 'element',
                  },
                  { tag: 'custom-element-3', type: 'element' },
                ],
                type: 'column',
              },
              {
                attributes: { style: 'align-items: center;' },
                content: [
                  {
                    properties: { boolProp: true },
                    tag: 'custom-element-4',
                    type: 'element',
                    url: '/custom-element-4',
                  },
                ],
                type: 'column',
              },
            ],
            type: 'column',
          },
          {
            attributes: { style: 'flex-grow: 1; position:relative; bottom: 0;' },
            content: [],
            type: 'row',
          },
        ],
        type: 'row',
      },
    }

    const expectedOutput: V2PluginWithRef = {
      $ref: {
        schema: {
          properties: { foo: { type: 'string' } },
          type: 'object',
        },
        string: 'foo',
      },
      content: {
        attributes: { style: 'display: flex; flex-direction: column; height: 100%;' },
        content: [
          {
            attributes: {},
            content: undefined,
            properties: { customProperty: 'custom-property' },
            tag: 'custom-element-1',
          },
          {
            attributes: { style: 'display: flex; flex-direction: row; width: 100%' },
            content: [
              {
                attributes: { style: 'display: flex; flex-direction: row; align-items: center;' },
                content: [
                  {
                    attributes: { style: 'margin: 0 1vw 0 0;' },
                    content: undefined,
                    properties: { content: { en: 'foo', it: 'bar' } },
                    tag: 'custom-element-2',
                  },
                  { attributes: {}, content: undefined, tag: 'custom-element-3' },
                ],
                tag: 'div',
              },
              {
                attributes: { style: 'display: flex; flex-direction: row; align-items: center;' },
                content: [
                  {
                    attributes: {},
                    content: undefined,
                    properties: { boolProp: true },
                    tag: 'custom-element-4',
                  },
                ],
                tag: 'div',
              },
            ],
            tag: 'div',
          },
          {
            attributes: { style: 'display: flex; flex-direction: column; flex-grow: 1; position:relative; bottom: 0;' },
            content: [],
            tag: 'div',
          },
        ],
        tag: 'div',
      },
      sources: ['/custom-element-1', '/custom-element-4'],
    }

    const result = convertCompose(input as unknown as V1Compose)
    expect(result).to.deep.equal(expectedOutput)
  })

  it('should convert configuration with acl', () => {
    const input = {
      $ref: {
        schema: {
          aclExpression: '!groups.user',
          properties: { foo: { type: 'string' } },
          type: 'object',
        },
        string: 'foo',
      },
      content: {
        attributes: { style: 'height: 100%;' },
        content: [
          {
            aclExpression: 'groups.user',
            properties: { customProperty: 'custom-property' },
            tag: 'custom-element-1',
            type: 'element',
            url: '/custom-element-1',
          },
          {
            attributes: { style: 'width: 100%' },
            content: [
              {
                aclExpression: 'groups.user',
                attributes: {
                  aclExpression: 'groups.user',
                  style: 'align-items: center;',
                },
                content: [
                  {
                    attributes: { style: 'margin: 0 1vw 0 0;' },
                    properties: {
                      content: {
                        aclExpression: 'groups.user',
                        en: 'foo',
                        it: 'bar',
                      },
                    },
                    tag: 'custom-element-2',
                    type: 'element',
                  },
                  { tag: 'custom-element-3', type: 'element' },
                ],
                type: 'column',
              },
              {
                attributes: { style: 'align-items: center;' },
                content: [
                  {
                    properties: { boolProp: true },
                    tag: 'custom-element-4',
                    type: 'element',
                    url: '/custom-element-4',
                  },
                ],
                type: 'column',
              },
            ],
            type: 'column',
          },
          {
            aclExpression: 'groups.user',
            attributes: { style: 'flex-grow: 1; position:relative; bottom: 0;' },
            content: [],
            type: 'row',
          },
        ],
        type: 'row',
      },
    }

    const expectedOutput = {
      $ref: {
        schema: {
          aclExpression: '!groups.user',
          properties: { foo: { type: 'string' } },
          type: 'object',
        },
        string: 'foo',
      },
      content: {
        attributes: { style: 'display: flex; flex-direction: column; height: 100%;' },
        content: [
          {
            aclExpression: 'groups.user',
            attributes: {},
            content: undefined,
            properties: { customProperty: 'custom-property' },
            tag: 'custom-element-1',
          },
          {
            attributes: { style: 'display: flex; flex-direction: row; width: 100%' },
            content: [
              {
                aclExpression: 'groups.user',
                attributes: {
                  aclExpression: 'groups.user',
                  style: 'display: flex; flex-direction: row; align-items: center;',
                },
                content: [
                  {
                    attributes: { style: 'margin: 0 1vw 0 0;' },
                    content: undefined,
                    properties: {
                      content: {
                        aclExpression: 'groups.user',
                        en: 'foo',
                        it: 'bar',
                      },
                    },
                    tag: 'custom-element-2',
                  },
                  { attributes: {}, content: undefined, tag: 'custom-element-3' },
                ],
                tag: 'div',
              },
              {
                attributes: { style: 'display: flex; flex-direction: row; align-items: center;' },
                content: [
                  {
                    attributes: {},
                    content: undefined,
                    properties: { boolProp: true },
                    tag: 'custom-element-4',
                  },
                ],
                tag: 'div',
              },
            ],
            tag: 'div',
          },
          {
            aclExpression: 'groups.user',
            attributes: { style: 'display: flex; flex-direction: column; flex-grow: 1; position:relative; bottom: 0;' },
            content: [],
            tag: 'div',
          },
        ],
        tag: 'div',
      },
      sources: ['/custom-element-1', '/custom-element-4'],
    }

    const result = convertCompose(input as unknown as V1Compose)
    expect(result).to.deep.equal(expectedOutput)
  })
})
