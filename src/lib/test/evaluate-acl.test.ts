/*
 * Copyright 2021 Mia srl
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

import type { AclContext, Json } from '../evaluate-acl'
import { evaluateAcl } from '../evaluate-acl'

describe('Evaluate ACL', () => {
  interface Test {
    context: unknown
    expected: unknown
    json: unknown
    message?: string
  }

  const tests: Test[] = [
    {
      context: { groups: ['ceo', 'admin', 'developer'] },
      expected: [{ aclExpression: 'groups.admin && groups.ceo' }],
      json: [{ aclExpression: 'groups.admin && groups.ceo' }, { aclExpression: '!groups.developer' }],
    },
    {
      context: { groups: ['po', 'reviewer'] },
      expected: [{}, { aclExpression: '!groups.developer' }],
      json: [{}, { aclExpression: '!groups.developer' }, { aclExpression: 'groups.admin && groups.ceo' }],
    },
    {
      context: { groups: ['po', 'reviewer'] },
      expected: [],
      json: [],
    },
    {
      context: { groups: [] },
      expected: [],
      json: [],
    },
    {
      context: { groups: [] },
      expected: { test: { nested: { object: {} } } },
      json: { test: { nested: { object: {} } } },
    },
    {
      context: { groups: [] },
      expected: { test: {} },
      json: { test: { nested: { aclExpression: 'groups.admin && groups.ceo', object: {} } } },
    },
    {
      context: { groups: ['ceo', 'admin'] },
      expected: { test: { nested: { aclExpression: 'groups.admin && groups.ceo', object: {} } } },
      json: { test: { nested: { aclExpression: 'groups.admin && groups.ceo', object: {} } } },
    },
    {
      context: { groups: ['po', 'admin'] },
      expected: { test: {} },
      json: { test: { nested: { aclExpression: 'groups.admin && groups.ceo', object: {} } } },
    },
    {
      context: { groups: [], permissions: ['api.users.patch'] },
      expected: { test: {} },
      json: { test: { nested: { aclExpression: 'permissions.api.users.get || groups.admin', object: {} } } },
    },
  ]

  /*
   * permissions = {
   *
   * }
   * permissions.api.users.get
   * permissions.asdf-_0
   *
   */

  tests.forEach(({ context, expected, json, message }, idx) => {
    it(`#${idx}${message ? `- ${message}` : ''}`, () => {
      const result = evaluateAcl(json as Json, context as AclContext)
      expect(result).to.deep.equal(expected)
    })
  })
})
