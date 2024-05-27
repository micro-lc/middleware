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
import type { FastifyBaseLogger } from 'fastify'

import { evaluateAcl } from '../evaluate-acl'
import type { Json } from '../types'

describe('Evaluate ACL', () => {
  interface Test {
    aclContext: string[]
    expected: unknown
    json: unknown
    message?: string
  }

  const tests: Test[] = [
    {
      aclContext: ['groups.ceo', 'groups.admin', 'groups.developer'],
      expected: [{ expr: 'groups.admin && groups.ceo' }],
      json: [
        {
          aclExpression: 'groups.admin && groups.ceo',
          expr: 'groups.admin && groups.ceo',
        },
        {
          aclExpression: '!groups.developer',
          expr: '!groups.developer',
        },
      ],
    },
    {
      aclContext: ['groups.po', 'groups.reviewer'],
      expected: [{}, { expr: '!groups.developer' }],
      json: [
        {},
        {
          aclExpression: '!groups.developer',
          expr: '!groups.developer',
        },
        {
          aclExpression: 'groups.admin && groups.ceo',
          expr: 'groups.admin && groups.ceo',
        },
      ],
    },
    {
      aclContext: ['groups.po', 'groups.reviewer'],
      expected: [],
      json: [],
    },
    {
      aclContext: [],
      expected: [],
      json: [],
    },
    {
      aclContext: [],
      expected: { test: { nested: { object: {} } } },
      json: { test: { nested: { object: {} } } },
    },
    {
      aclContext: [],
      expected: { test: {} },
      json: { test: { nested: { aclExpression: 'groups.admin && groups.ceo', object: {} } } },
    },
    {
      aclContext: ['groups.ceo', 'groups.admin'],
      expected: { test: { nested: { object: {} } } },
      json: { test: { nested: { aclExpression: 'groups.admin && groups.ceo', object: {} } } },
    },
    {
      aclContext: ['groups.po', 'groups.admin'],
      expected: { test: {} },
      json: { test: { nested: { aclExpression: 'groups.admin && groups.ceo', object: {} } } },
    },
    {
      aclContext: ['permissions.api.users.patch'],
      expected: { test: {} },
      json: { test: { nested: { aclExpression: 'permissions.api.users.get', object: {} } } },
    },
    {
      aclContext: ['permissions.api'],
      expected: { test: {} },
      json: { test: { nested: {
        aclExpression: 'permissions.api && permissions.api.users && permissions.api.users.get',
        object: {},
      } } },
    },
    {
      aclContext: [],
      expected: {},
      json: {
        test: {
          aclExpression: 'expression',
        },
      },
    },
    {
      aclContext: ['groups.po', 'groups.admin'],
      expected: true,
      json: true,
    },
    {
      aclContext: ['groups.doctor'],
      expected: [{ expr: 'groups.superadmin || groups.admin || groups.doctor' }],
      json: [
        {
          aclExpression: 'groups.superadmin || groups.admin || groups.secretary',
          expr: 'groups.superadmin || groups.admin || groups.secretary',
        },
        {
          aclExpression: 'groups.superadmin || groups.admin || groups.doctor',
          expr: 'groups.superadmin || groups.admin || groups.doctor',
        },
        {
          aclExpression: 'groups.superadmin || groups.admin',
          expr: 'groups.superadmin || groups.admin',
        },
      ],
    },
    {
      aclContext: ['groups.doctor', 'permissions.api.users.get', 'permissions.api.users.post', 'permissions.api.test-crud.all'],
      expected: [
        { expr: 'permissions.api.test-crud.all || permissions.api.test-crud.get' },
        { expr: 'groups.superadmin || groups.admin || groups.doctor' },
      ],
      json: [
        {
          aclExpression: 'permissions.api.test-crud.all || permissions.api.test-crud.get',
          expr: 'permissions.api.test-crud.all || permissions.api.test-crud.get',
        },
        {
          aclExpression: 'groups.superadmin || groups.admin || groups.secretary',
          expr: 'groups.superadmin || groups.admin || groups.secretary',
        },
        {
          aclExpression: 'groups.superadmin || groups.admin || groups.doctor',
          expr: 'groups.superadmin || groups.admin || groups.doctor',
        },
        {
          aclExpression: 'groups.superadmin || groups.admin',
          expr: 'groups.superadmin || groups.admin',
        },
      ],
    },
    {
      aclContext: ['permissions.api.users.post', 'permissions.api.users.count.get'],
      expected: [{ expr: 'permissions.api.users.count.get' }],
      json: [
        {
          aclExpression: 'permissions.api',
          expr: 'permissions.api',
        },
        {
          aclExpression: 'permissions.api.users.count.get',
          expr: 'permissions.api.users.count.get',
        },
        {
          aclExpression: 'permissions.api.companies',
          expr: 'permissions.api.companies',
        },
      ],
    },
    {
      aclContext: ['groups.doctor', 'permissions.api.users.post', 'permissions.api.users.count.get'],
      expected: [
        { expr: '(groups.doctor && !permissions.api.users.post) || permissions.api.users.count.get' },
        { expr: '(groups.doctor === true && permissions.api.users.post === true)' },
      ],
      json: [
        {
          aclExpression: '(groups.doctor && !permissions.api.users.post) || permissions.api.users.count.get',
          expr: '(groups.doctor && !permissions.api.users.post) || permissions.api.users.count.get',
        },
        {
          aclExpression: '(groups.doctor === true && permissions.api.users.post === true)',
          expr: '(groups.doctor === true && permissions.api.users.post === true)',
        },
        {
          aclExpression: '(groups.doctor === false && permissions.api.users.post === true)',
          expr: '(groups.doctor === false && permissions.api.users.post === true)',
        },
        {
          aclExpression: '(groups.doctor && permissions.api.users.post === false)',
          expr: '(groups.doctor && permissions.api.users.post === false)',
        },
      ],
    },
  ]

  // @ts-expect-error incomplete for test purposes
  const loggerMock: FastifyBaseLogger = {
    warn: () => { /* noop */ },
  }

  tests.forEach(({ aclContext, expected, json, message }, idx) => {
    it(`#${idx}${message ? `- ${message}` : ''}`, () => {
      const result = evaluateAcl(loggerMock, json as Json, aclContext)
      expect(result).to.deep.equal(expected)
    })
  })
})
