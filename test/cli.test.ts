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
import { exec, execSync } from 'child_process'
import { statSync, readFileSync } from 'fs'
import { resolve as pathResolve } from 'path'

import { expect } from 'chai'

import { createTmpDir } from '../src/utils/test-utils'

describe('CLI tests', () => {
  let tempPath: string
  let cleanup: (() => Promise<unknown>) | undefined

  before(async () => {
    const { cleanup: cc, name } = (await createTmpDir({}))
    cleanup = cc
    tempPath = name
    expect(typeof tempPath).to.equal('string')
  })

  after(async () => {
    await cleanup?.()
  })

  it('should convert auth/config from v1 to config v2', async () => {
    let execResolve: (() => void) | undefined
    let execReject: ((reason?: unknown) => void) | undefined
    const done = new Promise<void>((resolve, reject) => {
      execResolve = resolve
      execReject = reject
    })
    const authPath = pathResolve(__dirname, 'mocks/auth.json')
    const configPath = pathResolve(__dirname, 'mocks/config.json')

    exec(`node dist/cli -d ${tempPath} --mode config ${authPath} ${configPath}`, (error) => {
      error === null
        ? execResolve?.()
        : execReject?.(error)
    })

    await done

    const v2ConfigFilePath = pathResolve(tempPath, 'config.json')

    expect(statSync(v2ConfigFilePath).isFile()).to.be.true

    const created = readFileSync(v2ConfigFilePath).toString()
    const snapshot = readFileSync(pathResolve(__dirname, 'snapshots/config.json')).toString()

    expect(created).to.equal(snapshot)
  })

  it('should convert a compose plugin from v1 to config v2', () => {
    const pluginV1 = pathResolve(__dirname, 'mocks/plugin-v1.json')

    execSync(`node dist/cli -d ${tempPath} --mode compose ${pluginV1}`)

    const v2ConfigFilePath = pathResolve(tempPath, 'plugin-v1.json')

    expect(statSync(v2ConfigFilePath).isFile()).to.be.true

    const created = readFileSync(v2ConfigFilePath).toString()
    const snapshot = readFileSync(pathResolve(__dirname, 'snapshots/plugin-v2.json')).toString()

    expect(created).to.equal(snapshot)
  })
})
