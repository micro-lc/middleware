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

import { expect } from 'chai'

import { evaluateLanguage } from '../evaluate-language'
import type { Json } from '../types'

describe('Evaluate Language', () => {
  interface Test {
    expected: Json
    json: Json
    labelsMap?: Record<string, unknown>
    message: string
  }

  const tests: Test[] = [
    {
      expected: { foo: 'bar' },
      json: { foo: 'bar' },
      message: 'should return input when no labels map',
    },
    {
      expected: {
        array: [0, false, 'translated array value'],
        foo: 'bar',
        parent: {
          key: 'value',
          nestedArray: ['first', 'translated nested array value'],
          nestedParent: {
            anotherNestedText: 'translated nested text',
            nestedProp: true,
            nestedText: 'translated nested text',
          },
          text: 'translated text',
        },
        title: 'translated title',
      },
      json: {
        array: [0, false, 'main.array.value'],
        foo: 'bar',
        parent: {
          key: 'value',
          nestedArray: ['first', 'main.parent.array.value'],
          nestedParent: {
            anotherNestedText: 'main.parent.nested-parent.text',
            nestedProp: true,
            nestedText: 'main.parent.nested-parent.text',
          },
          text: 'main.parent.text',
        },
        title: 'main.title',
      },
      labelsMap: {
        main: {
          parent: {
            text: 'translated text',
          },
        },
        'main.array.value': 'translated array value',
        'main.parent.array.value': 'translated nested array value',
        'main.parent.nested-parent.text': 'translated nested text',
        'main.title': 'translated title',
      },
      message: 'should replace label values',
    },
  ]

  tests.forEach(({ expected, json, labelsMap, message }, index) => {
    it(`#${index} - ${message}`, () => {
      const result = evaluateLanguage(json, labelsMap)
      expect(result).to.deep.equal(expected)
    })
  })
})
