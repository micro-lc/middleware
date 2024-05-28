import type { QuickJSContext } from 'quickjs-emscripten'
import { newAsyncRuntime } from 'quickjs-emscripten'

import type { AclContextBuilderInput } from '../config'

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
    context.unwrapResult(wrappedResult).dispose()
    const result = context.getProp(context.global, 'result').consume(context.dump.bind(context)) as string[]
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
