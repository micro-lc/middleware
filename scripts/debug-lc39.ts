import path from 'path'

import lc39 from '@mia-platform/lc39'
import dotenv from 'dotenv'

const { parsed: envVariables } = dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const main = async (override?: string[]) => {
  const paths = override ?? process.argv.slice(2)
  const server = await lc39(path.resolve(__dirname, '../src/server.ts'), { envVariables })

  const promises = Array(paths.length).fill(0)
    .map((_, idx) => new Promise((resolve, reject) => {
      server.inject(paths[idx], (err: Error | null | undefined, response) => {
        if (err) {
          reject(err)
        } else if (response.statusCode > 299) {
          console.error(
            `${paths[idx]} responded with ${response.statusCode}`
          )
          resolve(response)
        } else {
          console.info(
            `${paths[idx]} responded with ${response.statusCode}`
          )
          resolve(response)
        }
      })
    }))

  await Promise.all(promises)
}

main(['http://localhost:3001/public'])
  .catch(console.error)
