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

import { expect } from 'chai'

import type { AclContextBuilderInput } from '../../config'
import _sandbox from '../sandbox'

describe('Sandbox', () => {
  const script = 'export default function (input) { return [input.headers.userproperties] }'
  const sandbox = _sandbox.getInstance(script)

  it('Ensure singleton', () => {
    const sandbox2 = _sandbox.getInstance(script)
    expect(sandbox2).to.deep.equal(sandbox)
  })

  it('Scripts throws error', async () => {
    const input: AclContextBuilderInput = {
      // @ts-expect-error needed for test
      headers: undefined,
      method: 'GET',
      pathParams: {},
      queryParams: {},
      url: '/configurations/file.json',
    }

    await expect(sandbox.evalAclContextBuilder(input)).to.be.rejectedWith('External ACL context builder failed: cannot read property \'userproperties\' of undefined')
  })

  it('Eval ACL context builder', async () => {
    const input: AclContextBuilderInput = {
      headers: {
        userproperties: 'property',
      },
      method: 'GET',
      pathParams: {},
      queryParams: {},
      url: '/configurations/file.json',
    }

    const result = await sandbox.evalAclContextBuilder(input)
    expect(result).to.deep.equal(['property'])
  })
})
