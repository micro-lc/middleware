import { readFile } from 'fs/promises'

const fsCache = new Map<string, Promise<Buffer>>()

async function publicHandler(filename: string, injectNonce: (input: string) => string): Promise<Buffer> {
  const bufferPromise: Promise<Buffer> = fsCache.get(filename) ?? readFile(filename)
  fsCache.set(filename, bufferPromise)

  // in case of html, parse variables
  if (filename.endsWith('.html')) {
    const content = (await bufferPromise).toString('utf-8')
    return Buffer.from(injectNonce(content), 'utf-8')
  }

  // reset buffer with index.html file
  return bufferPromise
}

export { publicHandler }
