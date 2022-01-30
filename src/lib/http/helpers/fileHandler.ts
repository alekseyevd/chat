import fs from 'fs'
import os from 'os'
import path from 'path'
import stream from 'stream';

export default async function fileUploadHandler (file: stream, params: any) {
  if (!params.filename) throw new Error('Invalid filename...')

  return new Promise((resolve, reject) => {
    const fileName = path.join(os.tmpdir(), `[${Date.now()}]_${params.filename}`)
    const stream = fs.createWriteStream(fileName)

    file
      .pipe(stream)
      .on('finish', () => resolve(fileName))
      .on('error', (error: Error) => reject(error))
  })
}