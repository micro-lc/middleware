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
