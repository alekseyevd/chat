type val = {
  [key: string]: Function
}
 
const validators: val = {
  date: (value: string): Boolean => {
    const date = new Date(value)
    if (!isNaN(date.getDate())) {
      let month = date.getMonth() + 1
      let monthString = month < 10 ? '0'+month : month
      const day = date.getDate() < 10 ? '0'+ date.getDate() : date.getDate()
      const dateString = `${date.getFullYear()}-${monthString}-${day}`
    
      if (dateString === value || value === date.toISOString()) {
        return true
      } else {
        return false
      }
    } else {
      return false
    }
  },
  email: (value: string): Boolean => {
    const regexp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regexp.test(value.toLowerCase())
  }
}

export default function validate(schema: any, value: any, prop: string = 'value'): { result: boolean, errors?: Array<string>} {
  let errors: Array<string> =  []
  switch (schema.type) {
    case 'object':
      if (typeof value !== 'object') {
        errors.push(`typeof ${prop} must be 'object'`)
        break
      }

      const required = schema.required || []
      const keys = Object.keys(schema.properties)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        
        if (!value.hasOwnProperty(key) && required.includes(key)) {
          errors.push(`${prop} must contain ${key}`)
        }

        if (value.hasOwnProperty(key)) {
          const res = validate(schema.properties[key], value[key], key)
          if (res.errors) errors = errors.concat(res.errors)
        }
      }

      if (schema.additionalProperties === false) {
        const keyValues = Object.keys(value).filter(k => {
          return !keys.includes(k)
        })
        if (keyValues.length) {
          errors.push(`properties ${keyValues.join(', ')} are not allowed`)
        }
      }
      break

    case 'string':
      if (typeof value !== 'string') {
        errors.push(`typeof ${prop} must be 'string'`)
        break
      }
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`length of poperty '${prop}' must be not less than ${schema.minLength} chars`)
        break
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`length of poperty '${prop}' must be not greater than ${schema.maxLength} chars`)
        break
      }
      if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
        errors.push(`'${prop}' must be one of [${schema.enum.join(', ')}]`)
        break
      }
      if (schema.format) {
        if (validators.hasOwnProperty(schema.format)) {
          const result = validators[schema.format](value)
          if (!result) {
            errors.push(`invalid ${schema.format} format in property '${prop}`)
          }
        }
      }
      break

    case 'integer':
      if (!Number.isInteger(value)) {
        errors.push(`typeof ${prop} must be 'integer'`)
      }
      break

    case 'number':
      if (typeof value !== 'number') {
        errors.push(`typeof ${prop} must be 'number'`)
        break
      }
      if (schema.minimum && value < schema.minimum) {
        errors.push(`${prop} must be not less than ${schema.minimum}`)
        break
      }
      if (schema.maximum && value > schema.maximum) {
        errors.push(`${prop} must be not greater than ${schema.maximum}`)
        break
      }
      break
  
    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push(`typeof ${prop} must be 'boolean'`)
      }
      break

    case 'array':
      if (!Array.isArray(value)) {
        errors.push(`typeof ${prop} must be 'array'`)
        break
      }
      if (schema.minItems && value.length < schema.minItems) {
        errors.push(`'${prop}.length' must be not less than ${schema.minItems}`)
        break
      }
      if (schema.maxItems && value.length > schema.maxItems) {
        errors.push(`'${prop}.length' must be not greater than ${schema.maxItems}`)
        break
      }

      for (let i = 0; i < value.length; i++) {
        const res = validate(schema.items, value[i], `${prop}[${i}]`)
        if (res.errors) {
          errors = errors.concat(res.errors)
          break
        }
      }
      break
    
    case 'null':
      if (value !== null) errors.push(`typeof ${prop} must be 'null'`)
      break
      
    default:
      errors.push('unknown type in schema')
      break
  }

  if (errors.length) return { result: false, errors }

  return { result: true }
}