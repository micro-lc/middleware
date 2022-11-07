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

import { evaluateAcl } from '../evaluate-acl'
import type { Json } from '../types'

describe('Evaluate ACL', () => {
  interface Test {
    expected: unknown
    groups: string[]
    json: unknown
    message?: string
    permissions: string[]
  }

  const tests: Test[] = [
    {
      expected: [{ aclExpression: 'groups.admin && groups.ceo' }],
      groups: ['ceo', 'admin', 'developer'],
      json: [{ aclExpression: 'groups.admin && groups.ceo' }, { aclExpression: '!groups.developer' }],
      permissions: [],
    },
    {
      expected: [{}, { aclExpression: '!groups.developer' }],
      groups: ['po', 'reviewer'],
      json: [{}, { aclExpression: '!groups.developer' }, { aclExpression: 'groups.admin && groups.ceo' }],
      permissions: [],
    },
    {
      expected: [],
      groups: ['po', 'reviewer'],
      json: [],
      permissions: [],
    },
    {
      expected: [],
      groups: [],
      json: [],
      permissions: [],
    },
    {
      expected: { test: { nested: { object: {} } } },
      groups: [],
      json: { test: { nested: { object: {} } } },
      permissions: [],
    },
    {
      expected: { test: {} },
      groups: [],
      json: { test: { nested: { aclExpression: 'groups.admin && groups.ceo', object: {} } } },
      permissions: [],
    },
    {
      expected: { test: { nested: { aclExpression: 'groups.admin && groups.ceo', object: {} } } },
      groups: ['ceo', 'admin'],
      json: { test: { nested: { aclExpression: 'groups.admin && groups.ceo', object: {} } } },
      permissions: [],
    },
    {
      expected: { test: {} },
      groups: ['po', 'admin'],
      json: { test: { nested: { aclExpression: 'groups.admin && groups.ceo', object: {} } } },
      permissions: [],
    },
    {
      expected: { test: {} },
      groups: [],
      json: { test: { nested: { aclExpression: 'permissions.api.users.get', object: {} } } },
      permissions: ['api.users.patch'],
    },
    {
      expected: { test: {} },
      groups: [],
      json: { test: { nested: {
        aclExpression: 'permissions.api && permissions.api.users && permissions.api.users.get',
        object: {},
      } } },
      permissions: ['api'],
    },
    {
      expected: true,
      groups: ['po', 'admin'],
      json: true,
      permissions: [],
    },
    {
      expected: [{ aclExpression: 'groups.superadmin || groups.admin || groups.doctor' }],
      groups: ['doctor'],
      json: [
        { aclExpression: 'groups.superadmin || groups.admin || groups.secretary' },
        { aclExpression: 'groups.superadmin || groups.admin || groups.doctor' },
        { aclExpression: 'groups.superadmin || groups.admin' },
      ],
      permissions: [],
    },
    {
      expected: [
        { aclExpression: 'permissions.api.test-crud.all || permissions.api.test-crud.get' },
        { aclExpression: 'groups.superadmin || groups.admin || groups.doctor' },
      ],
      groups: ['doctor'],
      json: [
        { aclExpression: 'permissions.api.test-crud.all || permissions.api.test-crud.get' },
        { aclExpression: 'groups.superadmin || groups.admin || groups.secretary' },
        { aclExpression: 'groups.superadmin || groups.admin || groups.doctor' },
        { aclExpression: 'groups.superadmin || groups.admin' },
      ],
      permissions: ['api.users.get', 'api.users.post', 'api.test-crud.all'],
    },
    {
      expected: [{ aclExpression: 'permissions.api.users.count.get' }],
      groups: [],
      json: [
        { aclExpression: 'permissions.api' },
        { aclExpression: 'permissions.api.users.count.get' },
        { aclExpression: 'permissions.api.companies' },
      ],
      permissions: ['api.users.post', 'api.users.count.get'],
    },
    {
      expected: [
        { aclExpression: '(groups.doctor && !permissions.api.users.post) || permissions.api.users.count.get' },
        { aclExpression: '(groups.doctor === true && permissions.api.users.post === true)' },
      ],
      groups: ['doctor'],
      json: [
        { aclExpression: '(groups.doctor && !permissions.api.users.post) || permissions.api.users.count.get' },
        { aclExpression: '(groups.doctor === true && permissions.api.users.post === true)' },
        { aclExpression: '(groups.doctor === false && permissions.api.users.post === true)' },
        { aclExpression: '(groups.doctor && permissions.api.users.post === false)' },
      ],
      permissions: ['api.users.post', 'api.users.count.get'],
    },
  ]

  tests.forEach(({ groups, permissions, expected, json, message }, idx) => {
    it(`#${idx}${message ? `- ${message}` : ''}`, () => {
      const result = evaluateAcl(json as Json, groups, permissions)
      expect(result).to.deep.equal(expected)
    })
  })
})
