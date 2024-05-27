import type { QuickJSContext } from 'quickjs-emscripten'
import { newAsyncRuntime } from 'quickjs-emscripten'

import type { AclContextBuilderInput } from '../config'

const CODE = `export default function (input) {
        throw new Error('mamma')
        return [input.ciao]
      }
      `

class Sandbox {
  context: Promise<QuickJSContext>
  cache: Record<string, string[] | undefined>

  constructor() {
    this.cache = {}
    this.context = newAsyncRuntime().then((runtime) => {
      runtime.setModuleLoader(() => {
        return CODE
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

    const context = await this.context
    const code = `
      import customFunction from './customFunction.js'
      const input = JSON.parse(globalThis.input)
      globalThis.result = customFunction(input)
    `

    // const url = `data:text/javascript;base64,${Buffer.from(CODE).toString('base64')}`
    // const mod = await import(url)
    // performance.mark('aa')
    // console.log(mod.default(_input))
    // performance.mark('bb')
    // console.log(performance.measure('time2', 'aa', 'bb').duration)


    context.setProp(context.global, 'input', context.newString(hash))

    const wrappedResult = context.evalCode(code)
    context.unwrapResult(wrappedResult).dispose()
    const result = context.getProp(context.global, 'result').consume(context.dump.bind(context)) as string[]
    return result
    // if ('value' in wrappedResult) {
    //   const { value } = wrappedResult
    //   const returnedValue = context.dump(value) as string
    //   console.log('ret', returnedValue)
    //   value.dispose()
    // } else {
    //   console.error(wrappedResult.error)
    // }
  }
}

export default new Sandbox()
