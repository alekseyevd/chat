import mimeTypes from './mime.types.json'

function mime(types: { [key: string] : string }) {
  return function (ext: string | undefined) : string {
    return ext
      ? types[ext] || 'application/octet-stream'
      : 'application/octet-stream'
  }
}

export default mime(mimeTypes)