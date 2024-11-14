import { readFile } from 'fs/promises'
import { RuntimeConfig } from '../config'

const fsCache = new Map<string, Promise<Buffer>>()

async function publicHandler(filename: string, injectNonce: (input: string) => string, config: RuntimeConfig): Promise<Buffer> {
  let bufferPromise: Promise<Buffer>
  
  if (config.ENABLE_CACHE === "true") {
    bufferPromise = fsCache.get(filename) ?? readFile(filename)
    fsCache.set(filename, bufferPromise)
  } else {
    bufferPromise = readFile(filename)
  }

  // in case of html, parse variables
  if (filename.endsWith('.html')) {
    const content = (await bufferPromise).toString('utf-8')
    return Buffer.from(injectNonce(content), 'utf-8')
  }

  // reset buffer with index.html file
  return bufferPromise
}

export { publicHandler }
