
import { PORT } from './config'
import HttpServer from './lib/http'
import { routes } from './routes/index'

const server = new HttpServer({
  routes,
  port: PORT,
})

server.listen(() => {
  console.log(`Server listening on port ${PORT}`)
})