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
import { JSONPath } from 'jsonpath-plus'

import type { Json } from './types'

type UserGroupsObject = Record<string, boolean>;

type UserPermissionsObject = Record<string, boolean | object>;

interface FilterableObject {
  aclExpression: string
}

const userGroupsObjectBuilder = (userGroups: string[]) => {
  const userGroupsObject: UserGroupsObject = {}
  for (const userGroup of userGroups) {
    userGroupsObject[userGroup] = true
  }
  return userGroupsObject
}

const createUserPermissionsNestedObject = (originalObject: any, permissionPaths: string[]) => {
  for (let i = 0; i < permissionPaths.length; i++) {
    if (i < permissionPaths.length - 1) {
      // eslint-disable-next-line no-param-reassign, no-multi-assign,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      originalObject = originalObject[permissionPaths[i]] = originalObject[permissionPaths[i]] || {}
    } else {
      // eslint-disable-next-line no-multi-assign, no-param-reassign,@typescript-eslint/no-unsafe-member-access
      originalObject = originalObject[permissionPaths[i]] = true
    }
  }
}

const userPermissionsObjectBuilder = (userPermissions: string[]) => {
  const userPermissionObject: UserPermissionsObject = {}

  for (const userPermission of userPermissions) {
    const permissions = userPermission.split('.')
    createUserPermissionsNestedObject(userPermissionObject, permissions)
  }

  return userPermissionObject
}

const buildPluginFunction = (plugin: FilterableObject) => {
  const bracketsNotationExpression = plugin.aclExpression
    .replace(/\.(.+?)(?=\.|$| |\))/g, (_, string) => `?.['${string as string}']`)

  const booleanEvaluationExpression = bracketsNotationExpression.replace(/'](?=]|$| )/g, `'] === true`)

  // eslint-disable-next-line no-new-func,@typescript-eslint/no-implied-eval
  return new Function('groups', 'permissions', `return !!(${booleanEvaluationExpression})`)
}

const evaluatePluginExpression = (userGroupsObject: UserGroupsObject, userPermissionsObject: UserPermissionsObject) => {
  return (plugin: FilterableObject): boolean => {
    const expressionEvaluationFunction = buildPluginFunction(plugin)
    return expressionEvaluationFunction(userGroupsObject, userPermissionsObject) as boolean
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
const jsonPathCallback = (valuesToAvoid: string[], expressionEvaluator: Function) =>
  (payload: string, _: unknown, fullPayload: { value: unknown }) => {
    if (!expressionEvaluator(fullPayload.value)) {
      valuesToAvoid.push(payload)
    }
  }

const patchCreator = (valueToAvoid: string): Operation => ({
  op: 'remove',
  path: valueToAvoid,
})

export const evaluateAcl = (jsonToFilter: Json, userGroups: string[], userPermissions: string[]) => {
  const clonedJsonToFilter = deepClone(jsonToFilter) as Json

  const userGroupsObject = userGroupsObjectBuilder(userGroups)
  const userPermissionsObject = userPermissionsObjectBuilder(userPermissions)

  const expressionEvaluator = evaluatePluginExpression(userGroupsObject, userPermissionsObject)
  const valuesToAvoid: string[] = []
  const pathCallback = jsonPathCallback(valuesToAvoid, expressionEvaluator)

  do {
    valuesToAvoid.splice(0)
    JSONPath({ callback: pathCallback, json: clonedJsonToFilter, path: '$..aclExpression^', resultType: 'pointer' })
    const [patchToApply] = valuesToAvoid

    patchToApply && applyOperation(clonedJsonToFilter, patchCreator(patchToApply))
  } while (valuesToAvoid.length !== 0)

  return clonedJsonToFilter
}
