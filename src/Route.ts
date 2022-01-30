import { IContext } from './lib/http/interfaces'
import validator from './lib/validate'
import { IRoute } from './lib/http/interfaces'
import EventEmitter from 'events'

export default class Route extends EventEmitter implements IRoute {
  private _method: string
  private _path: string
  private _validate: any
  private _options: any
  private _auth: boolean

  constructor(params: any) {
    super()
    this._method = params.method
    this._path = params.path
    this._validate = params.validate
    this._auth = params.auth || false
    this._options = params.options
    if (params.handler) {
      this._handler = params.handler
    }
  }

  async _handler(ctx: IContext): Promise<any> {
    throw new Error('handler is not defuned')
  }

  /* please, implement authenticate method here */
  private authenticate(ctx: IContext): any {
    return undefined
  }

  private authorize(user: any): boolean {
    return !!user
  }

  private async validate(ctx: IContext): Promise<Array<string>> {
    const bodySchema = this._validate?.body
    const querySchema = this._validate?.query
    const paramsSchema = this._validate?.params

    if (bodySchema) {
      const { body } = await ctx.parseBody()
      
      const { errors } = validator(bodySchema, body)
      if (errors) return errors
    }

    if (querySchema) {
      const query = ctx.query
      const { errors } = validator(querySchema, query)
      if (errors) return errors
    }

    if (paramsSchema) {
      const params = ctx.params
      const { errors } = validator(paramsSchema, params)
      if (errors) return errors
    }
    return []
  }

  private async handleRequest(ctx: IContext) {
    if (this._method && this._method !== ctx.method) throw new Error('method not allowed')

    let user
    if (this._auth) {
      user = this.authenticate(ctx)
      ctx.set('user', user)
      
      const hasAccess = this.authorize(user)
      if (!hasAccess) throw new Error('forbidden')
    }

    const errors = await this.validate(ctx)
    if (errors.length) throw new Error(errors.join(', '))
  
    return this._handler(ctx)
  }

  get method() {
    return this._method
  }

  get path() {
    return this._path
  }

  get options() {
    return this._options
  }

  get action() {
    return this.handleRequest.bind(this)
  }
}
