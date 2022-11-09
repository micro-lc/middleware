import type { Logger } from './utils'

export enum Version {
  V1 = 1,
  V2 = 2
}

export enum ConversionMode {
  COMPOSE = 'compose',
  CONFIG = 'config'
}

export type Permutation = `v${Version}v${Version}${ConversionMode}`

export type Converter = (ctx: CliContext) => Promise<void>

export interface CliOptions {
  dir?: string
  elementComposerUrlRegex?: RegExp
  from: Version
  mode: ConversionMode
  quiet?: boolean
  to: Version
}

export interface CliContext extends Omit<CliOptions, 'quiet'>{
  fileAbsPaths: string[]
  logger: Logger
}

export type WithAcl<T = Record<string, unknown>> = T & { aclExpression?: string }
