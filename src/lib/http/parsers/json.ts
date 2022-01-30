import { IBodyParser } from "../interfaces";

export const json: IBodyParser = async (req) => {
  const buffers = []
  for await (const chunk of req) buffers.push(chunk)
  return { body: JSON.parse(Buffer.concat(buffers).toString()) }
}