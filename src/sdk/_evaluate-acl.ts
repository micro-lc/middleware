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

import type { Operation } from 'fast-json-patch'
import { applyOperation, deepClone } from 'fast-json-patch'
import type { JSONPathCallback } from 'jsonpath-plus'
import { JSONPath } from 'jsonpath-plus'

export type Json = null | boolean | number | string | object | (null | boolean | number | string | object)[]

export type AclContext = Record<string, string[]>
type AclValue = Record<string, boolean>

interface ObjectWithAcl {
  [key: string]: unknown
  aclExpression: string
}

type AclExpressionEvaluator = (objectWithAcl: ObjectWithAcl) => boolean

const buildAclValue = (values: string[]): AclValue => {
  const aclContext: AclValue = {}

  for (const value of values) {
    aclContext[value] = true
  }

  return aclContext
}

const buildAclExpressionEvaluator = (aclKeys: string[], aclValues: AclValue[]): AclExpressionEvaluator => {
  return objectWithAcl => {
    // eslint-disable-next-line no-new-func,@typescript-eslint/no-implied-eval
    const evaluator = new Function(...aclKeys, `return !!(${objectWithAcl.aclExpression})`)
    return evaluator(...aclValues) as boolean
  }
}

const jsonPathCallback = (valuesToAvoid: string[], expressionEvaluator: AclExpressionEvaluator): JSONPathCallback => {
  return (payload: string, _, fullPayload: { value: ObjectWithAcl }) => {
    if (!expressionEvaluator(fullPayload.value)) {
      valuesToAvoid.push(payload)
    }
  }
}

const patchCreator = (valueToAvoid: string): Operation => ({ op: 'remove', path: valueToAvoid })

export const evaluateAcl = <T extends Json = Json>(json: T, aclContext: AclContext): T => {
  const clonedJson = deepClone(json) as T

  const aclKeys = Object.keys(aclContext)
  const aclValues = Object.values(aclContext).map(arrayVal => buildAclValue(arrayVal))

  const evaluateAclExpression = buildAclExpressionEvaluator(aclKeys, aclValues)
  const valuesToAvoid: string[] = []
  const pathCallback = jsonPathCallback(valuesToAvoid, evaluateAclExpression)

  do {
    valuesToAvoid.splice(0)

    JSONPath({ callback: pathCallback, json: clonedJson, path: '$..aclExpression^', resultType: 'pointer' })

    const [patchToApply] = valuesToAvoid

    if (patchToApply) {
      applyOperation(clonedJson, patchCreator(patchToApply))
    }
  } while (valuesToAvoid.length !== 0)

  return clonedJson
}

/*
permissions: ['api.users.get', 'api.users.post', 'api.test-crud.all', 'api', 'api.users']

['api.users.get', 'api.users.post', 'api.test-crud.all', 'api', 'api.users']

  api: [
    true,
    {
      users: {
        get: true,
        post: true
      },
      test-crud: {
        all: true
      }
    }
  ]

{
  plugins: [
    {
      aclExpression: 'permissions.api.test-crud.all || permissions.api.test-crud.get',
    },
    {
      aclExpression: 'groups.superadmin || groups.admin || groups.secretary',
    },
    {
      aclExpression: 'groups.superadmin || groups.admin || groups.doctor',
    },
    {
      aclExpression: 'groups.superadmin || groups.admin || permissions.api.test-crud.all,
    },
  ],
}
*/

