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

import { applyOperation, deepClone } from 'fast-json-patch'
import type { FastifyBaseLogger } from 'fastify'
import { JSONPath } from 'jsonpath-plus'

import type { Json } from './types'

type AclContextObject = Record<string, boolean | object>;

interface FilterableObject {
  aclExpression: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createAclContextNestedObject = (originalObject: any, paths: string[]) => {
  for (let i = 0; i < paths.length; i++) {
    if (i < paths.length - 1) {
      // eslint-disable-next-line no-param-reassign, no-multi-assign,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      originalObject = originalObject[paths[i]] = originalObject[paths[i]] || {}
    } else {
      // eslint-disable-next-line no-multi-assign, no-param-reassign,@typescript-eslint/no-unsafe-member-access
      originalObject = originalObject[paths[i]] = true
    }
  }
}

const aclContextObjectBuilder = (aclContext: string[]): AclContextObject => {
  const aclContextObject: AclContextObject = {}

  for (const acl of aclContext) {
    const paths = acl.split('.')
    createAclContextNestedObject(aclContextObject, paths)
  }

  return aclContextObject
}

const buildPluginFunction = (plugin: FilterableObject, aclContextObject: AclContextObject) => {
  const bracketsNotationExpression = plugin.aclExpression
    .replace(/\.(.+?)(?=\.|$| |\))/g, (_, string) => `?.['${string as string}']`)

  const booleanEvaluationExpression = bracketsNotationExpression.replace(/'](?=]|$| )/g, `'] === true`)

  // eslint-disable-next-line no-new-func,@typescript-eslint/no-implied-eval
  return new Function(...Object.keys(aclContextObject), `return !!(${booleanEvaluationExpression})`)
}

const evaluatePluginExpression = (logger: FastifyBaseLogger, aclContextObject: AclContextObject) => {
  return (plugin: FilterableObject): boolean => {
    const expressionEvaluationFunction = buildPluginFunction(plugin, aclContextObject)

    try {
      return expressionEvaluationFunction(...Object.values(aclContextObject)) as boolean
    } catch (err) {
      logger.warn({ aclContextObject }, `Error evaluating expression "${plugin.aclExpression}"`)
      return false
    }
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
const jsonPathCallback = (valuesToAvoid: string[], expressionEvaluator: Function) => {
  return (payload: string, _: unknown, fullPayload: { value: unknown }) => {
    if (!expressionEvaluator(fullPayload.value)) {
      valuesToAvoid.push(payload)
    }
  }
}

/**
 * This method [evaluates](#acl-application) `aclExpression` keys in input JSON. It does not modify the input object.
 *
 * @param {FastifyBaseLogger} logger - Logger instance.
 * @param {(string | number | boolean | Object | Array | null)} json - Input JSON with ACL rules to be evaluated.
 * @param {string[]} aclContext - List of caller's permissions.
 * @returns {Promise<string | number | boolean | Object | Array | null>} JSON with ACL rules evaluated.
 */
export const evaluateAcl = (logger: FastifyBaseLogger, json: Json, aclContext: string[]): Json => {
  const clonedJsonToFilter = deepClone(json) as Json

  const aclContextObject = aclContextObjectBuilder(aclContext)

  const expressionEvaluator = evaluatePluginExpression(logger, aclContextObject)
  const valuesToAvoid: string[] = []
  const pathCallback = jsonPathCallback(valuesToAvoid, expressionEvaluator)

  do {
    valuesToAvoid.splice(0)
    JSONPath({ callback: pathCallback, json: clonedJsonToFilter, path: '$..aclExpression^', resultType: 'pointer' })

    const [patchToApply] = valuesToAvoid

    patchToApply && applyOperation(clonedJsonToFilter, { op: 'remove', path: patchToApply })
  } while (valuesToAvoid.length !== 0)

  const pathsToNodesWithAclExpression: string[] = []

  JSONPath({
    callback: (payload: string) => pathsToNodesWithAclExpression.push(payload),
    json: clonedJsonToFilter,
    path: '$..aclExpression^',
    resultType: 'pointer',
  })

  pathsToNodesWithAclExpression.forEach(pathToNodeWithAclExpression => {
    const pathToAclExpression = `${pathToNodeWithAclExpression}/aclExpression`
    applyOperation(clonedJsonToFilter, { op: 'remove', path: pathToAclExpression })
  })

  return clonedJsonToFilter
}
