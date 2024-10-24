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

import type { QuickJSContext } from 'quickjs-emscripten'
import { newAsyncRuntime } from 'quickjs-emscripten'

export interface AclContextBuilderInput {
  body?: unknown
  headers: Record<string, string | string[] | undefined>
  method: string
  pathParams: unknown
  queryParams: unknown
  url: string
}

class Sandbox {
  context: Promise<QuickJSContext>
  cache: Record<string, string[] | undefined>

  constructor(script: string) {
    this.cache = {}
    this.context = newAsyncRuntime().then((runtime) => {
      runtime.setModuleLoader(() => {
        return script
      })
      return runtime.newContext()
    })
  }

  async evalAclContextBuilder(_input: AclContextBuilderInput): Promise<string[]> {
    const hash = JSON.stringify(_input)
    const cachedValue = this.cache[hash]
    if (cachedValue !== undefined) {
      return cachedValue
    }

    /* Follows an alternative if sandbox is too slow
    const script = `data:text/javascript;base64,${Buffer.from(CODE).toString('base64')}`
    const module = await import(script)
    const result = module.default(_input) */

    const context = await this.context
    const code = `
      import customFunction from './customFunction.js'
      const input = JSON.parse(globalThis.input)
      globalThis.result = customFunction(input)
    `

    context.setProp(context.global, 'input', context.newString(hash))
    const wrappedResult = context.evalCode(code)
    if (wrappedResult.error) {
      const error = context.dump(wrappedResult.error) as { message?: string }
      throw new Error(`External ACL context builder failed: ${error.message}`)
    }

    context.unwrapResult(wrappedResult).dispose()
    const result = context.getProp(context.global, 'result').consume(context.dump.bind(context)) as string[]
    this.cache[hash] = result

    return result
  }
}

export default (function _() {
  let instance: Sandbox

  return {
    getInstance: (script: string): Sandbox => {
      if (!instance) {
        instance = new Sandbox(script)
      }
      return instance
    },
  }
}())
