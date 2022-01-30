import { IBodyParser } from "../interfaces";

export const text: IBodyParser = async (req) => {
  const buffers = []
  for await (const chunk of req) buffers.push(chunk)
  return { 
    body: Buffer.concat(buffers).toString() 
  }
}