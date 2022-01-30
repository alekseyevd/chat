import getQueryParams from "../helpers/getQueryParams";
import { IBodyParser } from "../interfaces";

export const form: IBodyParser = async (req) => {
  const buffers = []
  for await (const chunk of req) buffers.push(chunk)
  const data = Buffer.concat(buffers).toString()
  const url = new URL('/?' + data, `http://${req.headers.host}`)
  const queryParams = getQueryParams(url)
  return { body: queryParams }
}