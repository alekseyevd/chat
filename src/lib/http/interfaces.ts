import { IncomingMessage, ServerResponse, IncomingHttpHeaders } from 'http'
import stream from 'stream'

export interface IRoute {
  method: string,
  path: string,
  action: (context: IContext) => Promise<any>
  options?: any,
  files?: any
}

export interface IContext {
  url: URL

  get method(): any

  get res(): ServerResponse

  get req(): IncomingMessage

  get body(): any

  get files(): any

  get headers(): IncomingHttpHeaders

  get params(): { [key: string]: string }

  get query(): { [key: string]: string }

  get(key: string): any

  set(key: string, value: any): void

  parseBody(): Promise<IContext>

  saveToFile(params: any): Promise<IContext>
}

export interface IFileHandler {
  (stream: stream, args: any) : Promise<any>
}

export interface IBodyParser {
  (req: IncomingMessage, args?: any, fileHandler?: IFileHandler): Promise<{ body?: any, files?: any }>
}

export interface IErrnoException extends Error {
  errno?: number;
  code?: string;
  syscall?: string;
  stack?: string;
}