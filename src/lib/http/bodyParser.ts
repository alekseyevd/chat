
import { IBodyParser } from './interfaces'
import { json } from './parsers/json'
import { form } from './parsers/form'
import { text} from './parsers/text'


const bodyParser: IBodyParser = async (req, options, fileHandler) => {
  const contentType = req.headers['content-type']
  
  if (contentType && contentType.indexOf('application/json') === 0) {
    return await json(req)
  }
  if (contentType && contentType.indexOf('application/x-www-form-urlencoded') === 0) {
    return await form(req)
  }
  if (contentType && contentType.indexOf('text/plain') === 0) {
    return await text(req)
  }
  throw new Error(`Invalid content-type. ${contentType} bodyParser is not implemented`)
}

export default bodyParser