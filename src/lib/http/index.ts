import { createServer, IncomingMessage, Server, ServerResponse } from 'http'
import { IRoute } from './interfaces'
import { Context } from './Context'
import FileServer from './static'
import stream from 'stream'

type HttpServerOptions = {
  port: number,
  routes?: Array<IRoute>,
  static?: { dir: string, cache?: number },
}

export default class HttpServer {
  private _routes: { [key: string]: { action: (context: Context) => Promise<any>, options?: any } }
  private _matching: Array<any> = []
  private _server: Server
  private _static?: FileServer
  private port: number

  constructor(params: HttpServerOptions) {
    this._routes = {}
    if (params.routes) {
      params.routes.forEach(r => {
        const p = r.path.match(/\{[^\s/]+\}/g)?.map(k => k.slice(1, -1)) || []
        if (p.length) {
          this._matching.push({
            path: new RegExp('^' + r.path.replace(/\{[^\s/]+\}/g, '([\\w-]+)') + '$'),
            method: r.method,
            params: p,
            action: r.action,
            options: r.options
          })
        } else {
          const key = `${r.method}:${r.path}`
          this._routes[key] = { 
            action: r.action,
            options: r.options
          }
        }
      })
    }

    this.port = params.port

    this._static = params.static ? new FileServer(params.static) : undefined

    this._server = createServer(this._listener.bind(this))
  }

  private async _listener(req: IncomingMessage, res: ServerResponse) { 
    const url = new URL(req.url || '/', `http://${req.headers.host}`)
    let path = url.pathname
    let method = req.method?.toLocaleLowerCase() || 'get'
    let params: any
    let action = this._routes[`${method}:${path}`]?.action
    let options = this._routes[`${method}:${path}`]?.options

    if (!action) {
      const route = this._matching.find(r => {
        return r.path.test(path) && r.method === method
      })
      
      if (route) { 
        action = route.action
        path = route.path
        params = route.params
        options = route.options
      } else {
        if (this._static) {
          this._static.serveFiles(req, res)
          return
        }
        
        res.statusCode = 404
        res.end('not found')
        return
      }
    }
  
    try {
      const context = new Context({
        url,
        path,
        params,
        res,
        req,
        options,
      })

      const result = await action(context)

      switch (typeof result) {
        case 'string':
          return res.end(result)
      
        case 'number':
          return res.end(result + '')

        case 'object':   
          if (result instanceof stream.Readable) {
            return result.pipe(res)
          }

          return res.end(JSON.stringify(result))

        default:
          // todo throw error
          if (res.getHeader('Connection') !== 'keep-alive') res.end()
          break;
      }

    } catch (error: unknown | Error) {
        //TODO handle error
        res.statusCode = 500
        if (error instanceof Error) {
          res.end(JSON.stringify({ message: error.message}))
        } else {
          res.end(error)
        }
    }
  }

  public listen(cb: () => void) {
    this._server.listen(this.port, cb)
  }

}
