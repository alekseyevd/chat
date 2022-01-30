import { ServerResponse, IncomingMessage } from 'http'
import path from 'path'
import fs from 'fs'
import mime from './mime'

export default class FileServer {
  private dir: string
  private cache: number

  constructor(params: { dir: string, cache?: number }) {
    this.dir = params.dir
    this.cache = params.cache || 0
  }

  serveFiles(req: IncomingMessage, res: ServerResponse): void {
    if (!req.url || req.method?.toLocaleLowerCase() !== 'get') {
      res.statusCode = 405
      res.end()
      return
    }
  
    const name = req.url.endsWith('/') ? req.url + 'index.html' : req.url
    
    const filePath = path.join(this.dir, name)
    if (!filePath.startsWith(this.dir)) {
      res.statusCode = 404
      res.end()
      return
    }

    const stream = fs.createReadStream(filePath)
    stream.on('error', function() {
      res.writeHead(404);
      res.end('not found');
    });
    //to-do mime type
    const fileExt = path.extname(name).substring(1);
    const mimeType = mime(fileExt)
  
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Cache-Control', `max-age=${this.cache}`)
    stream.pipe(res);
    return
  }
}

