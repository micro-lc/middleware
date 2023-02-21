/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run `yarn make-types` to regenerate this file.
 */

export type ContentTypeMap = Record<`.${string}`, string | string[]>
export type PublicHeadersMap = Record<`/${string}`, Record<string, Headers>>
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "arrayOrString".
 */
export type ArrayOrString = string[] | string
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "headers".
 */
export type Headers = string | ArrayOrString[]

export interface Config {
  contentTypeMap?: ContentTypeMap
  publicHeadersMap?: PublicHeadersMap
  [k: string]: unknown
}