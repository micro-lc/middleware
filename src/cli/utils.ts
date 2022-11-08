import path from 'path'
import process from 'process'

export interface Logger {
  error: (msg: string) => void
  info: (msg: string) => void
  success: (msg: string) => void
}

export const logger = (quiet?: boolean): Logger => ({
  error: msg => !quiet && console.log('\x1b[31m%s\x1b[0m', `✖ ${msg}`),
  info: msg => !quiet && console.log(msg),
  success: msg => !quiet && console.log('\x1b[32m%s\x1b[0m', `✔ ${msg}`),
})

export const toAbsolute = (inputPath: string): string => {
  return path.isAbsolute(inputPath) ? inputPath : path.join(process.cwd(), inputPath)
}
