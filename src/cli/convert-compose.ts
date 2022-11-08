import fs from 'fs/promises'
import path from 'path'

import type { Component as V1Component } from '@micro-lc/interfaces/v1'
import type {
  Content as V2Content,
  Component as V2Component,
  VoidComponent as V2VoidComponent,
  PluginConfiguration as V2Plugin,
} from '@micro-lc/interfaces/v2'

import type { Converter, WithAcl } from './types'
import type { Logger } from './utils'

export type RefBlock = Record<string, unknown>

export interface V1ComposeWithRef {
  $ref: RefBlock
  content: WithAcl<V1Component>
}

export type V1Compose = V1ComposeWithRef | WithAcl<V1Component>

export type V1Content = WithAcl<V1Component> | WithAcl<V1Component>[] | string | number

export type V2PluginWithRef = V2Plugin & { $ref?: RefBlock }

const isValidV1ComposeConfig = (input: unknown): boolean => {
  const validTypes = ['row', 'column', 'element']

  const isObject = input && typeof input === 'object' && !Array.isArray(input)
  const isWithoutRef = validTypes.includes((input as V1Component).type)
  const isWithRef = (input as Partial<V1ComposeWithRef>).$ref
    && (input as Partial<V1ComposeWithRef>).content
    && validTypes.includes((input as V1ComposeWithRef).content.type)

  return Boolean(isObject && (isWithRef || isWithoutRef))
}

const convertContent = (input: V1Content, accSources: string[]): V2Content => {
  if (typeof input === 'string' || typeof input === 'number') { return input }

  if (Array.isArray(input)) {
    return input.map(content => convertContent(content, accSources) as (V2Component | V2VoidComponent))
  }

  const {
    tag: inputTag,
    type: inputType,
    url: inputUrl,
    attributes: inputAttributes,
    content: inputContent,
    properties: inputProperties,
    busDiscriminator,
    aclExpression,
  } = input

  typeof inputUrl === 'string' && accSources.push(inputUrl)

  const attributes = (inputAttributes ?? {})
  const content = inputContent && convertContent(inputContent, accSources)
  const extra: Partial<WithAcl<V2Component>> = {}

  if (typeof busDiscriminator === 'string') { extra.properties = { eventBus: `eventBus.pool.${busDiscriminator}` } }
  if (inputProperties) { extra.properties = inputProperties as V2Component['properties'] }

  if (aclExpression) { extra.aclExpression = aclExpression }

  switch (inputType) {
  case 'row':
    extra.tag = 'div'
    extra.attributes = { ...attributes, style: `display: flex; flex-direction: column; ${attributes.style}` }
    break
  case 'column':
    extra.tag = 'div'
    extra.attributes = { ...attributes, style: `display: flex; flex-direction: row; ${attributes.style}` }
    break
  default:
    extra.tag = inputTag
    extra.attributes = attributes
    break
  }

  // @ts-expect-error We are safe about the type given the previous checks
  return { content, ...extra }
}

export const convertCompose = (input: V1Compose): V2PluginWithRef => {
  const inputRef = input.$ref as RefBlock | undefined
  const inputContent = inputRef ? input.content as V1ComposeWithRef['content'] : input as V1Component

  const sources: string[] = []
  const content = convertContent(inputContent, sources)

  return {
    ...(inputRef && { $ref: inputRef }),
    content,
    sources,
  }
}

const convertComposeConfigFile = async (logger: Logger, fileAbsPath: string, outDir?: string) => {
  const pathSegments = path.parse(fileAbsPath)
  if (pathSegments.ext !== '.json') {
    throw new TypeError(`${fileAbsPath} is not a JSON file`)
  }

  const rawContent = await fs.readFile(fileAbsPath, 'utf-8')
  const input = JSON.parse(rawContent) as unknown

  if (!isValidV1ComposeConfig(input)) {
    throw new TypeError(`${fileAbsPath} is not a valid v1 compose configuration`)
  }

  const output = convertCompose(input as V1Compose)

  let outputFilePath: string
  if (outDir && outDir !== pathSegments.dir) {
    outputFilePath = `${outDir}/${pathSegments.name}${pathSegments.ext}`
  } else {
    outputFilePath = `${pathSegments.dir}/${pathSegments.name}.v2${pathSegments.ext}`
  }

  await fs.writeFile(outputFilePath, JSON.stringify(output, null, 2))

  logger.success(`Successfully converted file ${fileAbsPath} to ${outputFilePath}`)
}

export const convertComposeConfigFiles: Converter = async ({ logger, fileAbsPaths, dir }) => {
  const promises = fileAbsPaths.map(fileAbsPath => {
    return convertComposeConfigFile(logger, fileAbsPath, dir)
      .catch((err: unknown) => {
        logger.error(`Error converting file ${fileAbsPath}`)
        console.error(err)
      })
  })

  await Promise.allSettled(promises)
}
