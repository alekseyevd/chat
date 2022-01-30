export default function getQueryParams(url: URL) {
  const queryParams: { [key: string]: any } = {}
  url.searchParams.forEach((value, key) => {
    let decodedKey = decodeURIComponent(key)
    let decodedValue = decodeURIComponent(value)
    if (decodedKey.endsWith('[]')) {
      decodedKey = decodedKey.replace("[]", "")
      queryParams[decodedKey] || (queryParams[decodedKey] = [])
      queryParams[decodedKey].push(decodedValue)
    } else {
      queryParams[decodedKey] = decodedValue
    }
  }) 
  return queryParams
}