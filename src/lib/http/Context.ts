import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http'
import stream from 'stream'
import bodyParser from './bodyParser';
import fileUploadHandler from './helpers/fileHandler';
import getQueryParams from './helpers/getQueryParams';
import { IContext } from './interfaces';

export class Context implements IContext {
  url: URL
  private _path: string | RegExp
  private _params: Array<string>
  private _res: ServerResponse
  private _req: IncomingMessage
  private _options: any
  private _body: any
  private _files: any
  private _map: Map<string, any>

  constructor(params: any) {
    this.url = params.url
    this._path = params.path
    this._params = params.params
    this._res = params.res
    this._req = params.req
    this._options = params.options
    this._map = new Map()
    // this.parseRequest = memoize(this.parseRequest.bind(this))

    if (params.options?.fileHandler) {
      this._handleFile = params.options.fileHandler
    }
  }

  write(str: string): void {
    this._res.write(str)
  }

  get method() {
    return this._req.method ? this._req.method.toLowerCase() : 'get'
  }

  get res() {
    return this._res
  }

  get req() {
    return this._req
  }

  get body() {
    // todo check if method parseBody was called
    return this._body
  }

  get files() {
    // todo check if method parseBody was called
    return this._files
  }

  get headers() {
    return this._req.headers
  }

  get query() {
    return getQueryParams(this.url)
  }

  get params() {
    const params : { [key: string]: string } = {}
    if (this._path instanceof RegExp) {
      const values = this.url.pathname.match(this._path)?.slice(1) || []
      
      for (let i = 0; i < this._params.length; i++) {
        params[this._params[i]] = values[i]
      }
      return params
    }

    return params
  }

  get(key: string) {
    return this._map.get(key)
  }

  set(key: string, value: any): void {
    this._map.set(key, value)
  }

  async parseBody() {
    // todo check if req is ended/ already read
    const { body, files } = await bodyParser(this._req, this._options, this._handleFile)
    this._body = body
    this._files = files
    return this
  }

  async saveToFile(params: any) {
    // todo check if req is ended/ already read
    const contentType = this._req.headers['content-type']

    if (contentType && contentType.indexOf('multipart/form-data') === 0)
        throw new Error('Invalid content type')
    if (contentType && contentType.indexOf('application/x-www-form-urlencoded') === 0) 
        throw new Error('Invalid content type')

    const filename = this.headers['file-name']
    if (!filename) throw new Error('Invalid filename')

    this._files = await this._handleFile(this._req, {
      filename,
      ...params
    })

    return this
  }

  private async _handleFile(file: stream, options: any) {
    return await fileUploadHandler(file, {
      filename: options.filename
    })
  }

  toJSON() {
    return {
      params: this.params,
      query: this.query,
      method: this.method,
    }
  }
}