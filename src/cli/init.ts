import { Command, InvalidArgumentError, InvalidOptionArgumentError } from 'commander'
import glob from 'glob'
import mkdirp from 'mkdirp'

import packageFile from '../../package.json'

import type { CliContext, CliOptions } from './types'
import { ConversionMode, Version } from './types'
import { logger, toAbsolute } from './utils'

type Option<T = unknown> = [flag: string, description: string, parser: (value: string) => T, defaultValue?: T]

const options: Record<keyof CliOptions, Option> = {
  dir: [
    '-d, --dir <dir>',
    'Absolute or relative path of the output directory',
    value => toAbsolute(value),
  ],
  from: [
    '-f, --from <version>',
    `Input files version. Chose between ${Object.values(Version).join(', ')}`,
    value => {
      if (!Object.values(Version).includes(value)) {
        throw new InvalidOptionArgumentError(`Not a valid version, choose between ${Object.values(Version).join(', ')}`)
      }
      return value
    },
    Version.V1,
  ],
  mode: [
    '-m, --mode <mode>',
    `Conversion mode. Chose between ${Object.values(ConversionMode).join(', ')}`,
    value => {
      if (!Object.values(ConversionMode).includes(value as ConversionMode)) {
        throw new InvalidOptionArgumentError(`Not a valid conversion mode, choose between ${Object.values(ConversionMode).join(', ')}`)
      }
      return value
    },
    ConversionMode.CONFIG,
  ],
  quiet: ['-q --quiet', 'No output on stdout', value => value],
  to: [
    '-t, --to <version>',
    `Output files version. Chose between ${Object.values(Version).join(', ')}`,
    value => {
      if (!Object.values(Version).includes(value)) {
        throw new InvalidOptionArgumentError(`Not a valid version, choose between ${Object.values(Version).join(', ')}`)
      }
      return value
    },
    Version.V2,
  ],
}

export const parseArgs = (): CliContext => {
  const context: Partial<CliContext> = {}

  const program = new Command()

  program
    .name('Servo conversion CLI')
    .description('TODO')
    .version(packageFile.version)

  Object.values(options).forEach(option => program.option(...option))

  program.argument('<globs...>', 'Absolute or relative glob(s) of files to be transformed')

  program.action((globs: string[], opts: CliOptions) => {
    const { quiet, dir, ...rest } = opts

    context.logger = logger(quiet)

    Object.assign(context, rest)

    let fileAbsPaths: string[] = []
    for (let globPattern of globs) {
      globPattern = toAbsolute(globPattern)
      fileAbsPaths = [...fileAbsPaths, ...glob.sync(globPattern)]
    }

    if (fileAbsPaths.length === 0) {
      throw new InvalidArgumentError('No file matches input globes')
    }

    if (context.from === Version.V1
      && context.to === Version.V2
      && context.mode === ConversionMode.CONFIG
      && fileAbsPaths.length !== 2
    ) {
      throw new InvalidArgumentError(`When converting from v1 to v2 with conversion mode ${context.mode}, you have to supply two input files. The first one should be the authentication configuration, and the second one should be the core configuration.`)
    }

    context.fileAbsPaths = fileAbsPaths

    if (dir) {
      mkdirp.sync(dir)
      context.dir = dir
    }
  })

  program.parse()

  return context as CliContext
}
