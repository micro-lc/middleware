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

import type { JsonWithReferences } from '../resolve-references'
import { resolveReferences } from '../resolve-references'
import type { Json } from '../types'

describe('Resolve references', () => {
  interface Test {
    expected: Json
    input : Json | JsonWithReferences
    message?: string
  }

  const tests: Test[] = [
    {
      expected: { test: true },
      input: { test: true },
    },
    {
      expected: {
        replaced: true,
        shouldKeep: true,
      },
      input: {
        $ref: { test: { replaced: true } },
        content: { $ref: 'test', shouldKeep: true },
      },
    },
    {
      expected: {
        otherObject: { replaced: true },
        replaced: true,
        shouldKeep: true,
      },
      input: {
        $ref: { test: { replaced: true } },
        content: {
          $ref: 'test',
          otherObject: { $ref: 'test' },
          shouldKeep: true,
        },
      },
    },
    {
      expected: {
        objectArray: [
          { replaced: true, test: true },
          { replaced: true, test: false },
        ],
        otherObject: {
          replaced: true,
        },
        shouldKeep: true,
      },
      input: {
        $ref: { test: { replaced: true } },
        content: {
          objectArray: [
            { $ref: 'test', test: true },
            { $ref: 'test', test: false },
          ],
          otherObject: { $ref: 'test' },
          shouldKeep: true,
        },
      },
    },
    {
      expected: { shouldKeep: true },
      input: {
        $ref: { test: { replaced: true } },
        content: { $ref: 'invalid', shouldKeep: true },
      },
    },
  ]

  tests.forEach(({ expected, input, message }, idx) => {
    it(`#${idx}${message ? `- ${message}` : ''}`, () => {
      const result = resolveReferences(input)
      expect(result).to.deep.equal(expected)
    })
  })
})
