import { readFileSync } from 'fs'
import { writeFile } from 'fs/promises'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import { ESLint } from 'eslint'
import { compileFromFile } from 'json-schema-to-typescript'
import { mkdirp } from 'mkdirp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schemasDirPath = resolve(__dirname, '../schemas')
const typesDirPath = resolve(__dirname, '../src/schemas')

const eslint = new ESLint({ fix: true })

const SCHEMA_FILE_NAME = 'config.schema.json'
const TYPES_FILE_NAME = 'index.d.ts'

const bannerComment = '/* eslint-disable */\n/**\n* This file was automatically generated by json-schema-to-typescript.\n* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,\n* and run `npm run make-types` to regenerate this file.\n*/'

const makeTypesFromSchema = async (schemaDirPath) => {
  const inputFilePath = resolve(__dirname, schemaDirPath, SCHEMA_FILE_NAME)

  const outputDirPath = resolve(typesDirPath)
  await mkdirp(outputDirPath)

  const outputFilePath = resolve(outputDirPath, TYPES_FILE_NAME)

  try {
    /** @type {import('json-schema-to-typescript').Options} */
    const compileProps = {
      $refOptions: {
        resolve: {
          http: {
            read({ url }) {
              const fileNameMatch = url.match(/v\d\/[^/]+$/g)
              if (fileNameMatch !== null && fileNameMatch[0] !== undefined) {
                return readFileSync(resolve(schemasDirPath, fileNameMatch[0]))
              }

              throw new TypeError(`Cannot find locally a file for ${url} $ref`)
            },
          },
        },
      },
      bannerComment,
      style: { semi: false },
      unreachableDefinitions: true,
    }

    const compiledTypes = await compileFromFile(inputFilePath, compileProps)

    const lintResults = await eslint.lintText(compiledTypes)
    const lintTypes = lintResults.map(lintResult => lintResult.source ?? '').join('\n')

    await writeFile(outputFilePath, lintTypes)

    console.log('\x1b[32m%s\x1b[0m', `✔ ${SCHEMA_FILE_NAME} compiled successfully`)
  } catch (err) {
    console.log('\x1b[31m%s\x1b[0m', `✖ Failed compiling ${SCHEMA_FILE_NAME}`)
    console.error(err)
  }
}

const main = async () => {
  // const schemasDirectoryContent = await readdir(schemasDirPath, { withFileTypes: true })
  // const schemasDirectoriesNames = schemasDirectoryContent.filter(dirent => dirent.isDirectory()).map(({ name }) => name)

  // const makeTypesPromises = schemasDirectoriesNames.map(schemaDirName => {
  await makeTypesFromSchema(schemasDirPath)
  // })

  // await Promise.allSettled(makeTypesPromises)
}

main().catch(err => console.error(err))
