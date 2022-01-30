import { IContext } from './lib/http/interfaces'
import Route from "./Route"

type Message = {
  date: number,
  from: string,
  data: string,
}

export default class Chat extends Route {
  private _users: Map<string, any>
  private _history: Array<Message>

  constructor(params: any) {
    super({
      ...params,
      method: 'post',
      validate: {
        body: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['connect', 'sendMessage', 'getUsers', 'getHistory']
            },
            name: {
              type: 'string'
            },
            token: {
              type: 'string',
            },
            message: {
              type: 'string'
            }
          },
          required: ['type'],
          additionalProperties: false,
        }
      }
    })
    this._users = new Map()
    this._history = []
  }

  async _handler(ctx: IContext) {
    const type = ctx.body.type
    switch (type) {
      case 'connect':
        return this.connect(ctx)
      case 'sendMessage':
        return this.sendMessage(ctx)
      case 'getUsers':
        return this.getUsers(ctx)
      case 'getHistory':
        return this.getHistory(ctx)
    }
  }

  private connect(ctx: IContext) {
    const onMessage = (message: string) => {
      ctx.res.write(`${message} \n\n`)
    }
    this.on('message', onMessage)

    const name = ctx.body.name
    if (!name) throw new Error('Invalid name value')
    const token = Buffer.from(name + Date.now()).toString('base64')

    ctx.res.statusCode = 200
    ctx.res.setHeader('Connection', 'keep-alive')
    ctx.res.setHeader('Content-Type', 'text/event-stream')

    this._users.set(token, name)
    ctx.res.write(`${JSON.stringify({ type: 'connect', token})} \n\n`)
    
    ctx.res.on('close', () => {
      this.removeListener('message', onMessage)
      this._users.delete(token)
    })
  }

  private sendMessage(ctx: IContext) {
    const token = ctx.body.token
    if (!this._users.has(token)) throw new Error('Invalid token')

    const message = { 
      type: 'message',
      date: Date.now(),
      from: this._users.get(token),
      data: ctx.body.message
    }

    this._history.push(message)
    this.emit('message', JSON.stringify(message))

    ctx.res.statusCode = 200
    return { status: 'done' }
  }

  private getUsers(ctx: IContext) {
    const token = ctx.body.token
    if (!this._users.has(token)) throw new Error('Invalid token')

    return { 
      status: 'done',
      data: Array.from(this._users, ([name, value]) => (value))
    }
  }

  private getHistory(ctx: IContext) {
    const token = ctx.query.token
    if (!this._users.has(token)) throw new Error('Invalid token')
    return {
      status: 'done',
      data: this._history
    }
  }
}
