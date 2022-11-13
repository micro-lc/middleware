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
import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { resolveReferences } from '../resolve-references'
import type { Json } from '../types'

describe('Resolve references', () => {
  chai.use(chaiAsPromised)

  describe('Successful parsing', () => {
    interface Test {
      expected: Json
      input : Json
      message?: string
    }

    const tests: Test[] = [
      {
        expected: { test: true },
        input: { test: true },
      },
      {
        expected: {
          content: { replaced: true, shouldKeep: true },
          definitions: { test: { replaced: true } },
        },
        input: {
          content: { $ref: '#/definitions/test', shouldKeep: true },
          definitions: { test: { replaced: true } },
        },
      },
      {
        expected: {
          content: { otherObject: { replaced: true }, replaced: true, shouldKeep: true },
          definitions: { test: { replaced: true } },
        },
        input: {
          content: { $ref: '#/definitions/test', otherObject: { $ref: '#/definitions/test' }, shouldKeep: true },
          definitions: { test: { replaced: true } },
        },
      },
      {
        expected: {
          content: {
            objectArray: [{ replaced: true, test: true }, { replaced: true, test: false }],
            otherObject: { replaced: true },
            shouldKeep: true,
          },
          definitions: { test: { replaced: true } },
        },
        input: {
          content: {
            objectArray: [{ $ref: '#/definitions/test', test: true }, { $ref: '#/definitions/test', test: false }],
            otherObject: { $ref: '#/definitions/test' },
            shouldKeep: true,
          },
          definitions: { test: { replaced: true } },
        },
      },
      {
        expected: {
          content: { replaced: true, shouldKeep: true },
          foo: { test: { replaced: true } },
        },
        input: {
          content: { $ref: '#/foo/test', shouldKeep: true },
          foo: { test: { replaced: true } },
        },
      },
    ]

    tests.forEach(({ expected, input, message }, idx) => {
      it(`#${idx}${message ? `- ${message}` : ''}`, async () => {
        const result = await resolveReferences(input)
        expect(result).to.deep.equal(expected)
      })
    })
  })

  it('should return input if type not supported', async () => {
    expect(await resolveReferences(3)).to.equal(3)
    expect(await resolveReferences(true)).to.equal(true)
    expect(await resolveReferences(null)).to.equal(null)
  })

  it('should throw if reference is not found', async () => {
    const input: Json = {
      content: { $ref: '#/definitions/invalid', shouldKeep: true },
      definitions: { test: { replaced: true } },
    }

    await expect(resolveReferences(input)).to.be.rejectedWith('Token "invalid" does not exist.')
  })

  it('should not tamper input', () => {
    const input: Json = {
      content: { $ref: '#/definitions/test', shouldKeep: true },
      definitions: { test: { replaced: true } },
    }

    const result = resolveReferences(input)

    expect(result).not.to.equal(input)
  })
})
