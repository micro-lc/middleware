import { convertComposeConfigFiles } from './convert-compose'
import { parseArgs } from './init'
import type { Converter, Permutation } from './types'

const permutationToConverterMap: { [key in Permutation]?: Converter } = {
  v1v2compose: convertComposeConfigFiles,
}

const cli = async () => {
  const context = parseArgs()

  const permutation: Permutation = `v${context.from}v${context.to}${context.mode}`
  const converter = permutationToConverterMap[permutation]

  if (!converter) {
    throw new TypeError(`No operation found for conversion "${context.mode}" from v${context.from} to v${context.to}`)
  }

  await converter(context)
}

cli().catch(console.error)
