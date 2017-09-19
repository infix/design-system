const { breakpoints, fontSizes, space } = require('./constants')

/* Most of this is a carbon copy from jxnblk/styled-system, but it fixes it
 * adds support for styled-components */

const is = n => n !== undefined && n !== null
const num = n => typeof n === 'number' && !isNaN(n)
const px = n => num(n) ? n + 'px' : n
const em = n => num(n) ? n + 'em' : n
const neg = n => n < 0
const arr = n => Array.isArray(n) ? n : [ n ]
const idx = (p, obj) => p.reduce((a, b) => (a && a[b]) ? a[b] : null, obj)

const mq = n => `@media screen and (min-width: ${em(n)})`

const breaks = props => [
  null,
  ...(idx([ 'theme', 'breakpoints' ], props) || breakpoints).map(mq)
]


/* from: jxnblk/styled-system/src/font-size.js */
const fx = scale => n => num(n) ? px(scale[n] || n) : n
export const fontSize = props => {
  const n = is(props.fontSize) ? props.fontSize : props.fontSize || props.f
  if (!is(n)) return null

  const scale = idx([ 'theme', 'fontSizes' ], props) || fontSizes

  if (!Array.isArray(n)) {
    return {
      fontSize: fx(scale)(n)
    }
  }

  const bp = breaks(props)

  return n
    .map(fx(scale))
    .map(dec('fontSize'))
    .map(media(bp))
    .reduce(merge, {})
}

/* from: jxnblk/styled-system/src/space.js */
const mx = scale => n => {
  if (!num(n)) {
    return n
  }

  const value = scale[Math.abs(n)] || Math.abs(n)
  if (!num(value)) {
    return value
  }

  return px(value * (neg(n) ? -1 : 1));
}

const getProperties = key => {
  const [ a, b ] = key.split('')
  const prop = mpProperties[a]
  const dirs = directions[b] || [ '' ]
  return dirs.map(dir => prop + dir)
}

const mpProperties = {
  m: 'margin',
  p: 'padding'
}

const directions = {
  t: [ 'Top' ],
  r: [ 'Right' ],
  b: [ 'Bottom' ],
  l: [ 'Left' ],
  x: [ 'Left', 'Right' ],
  y: [ 'Top', 'Bottom' ],
}

const dec = props => val => arr(props)
  .reduce((acc, prop) => (acc[prop] = val, acc), {})

const media = bp => (d, i) => is(d)
  ? bp[i] ? ({ [bp[i]]: d }) : d
  : null

const merge = (a, b) => Object.assign({}, a, b, Object.keys(b).reduce((obj, key) =>
  Object.assign(obj, {
    [key]: a[key] !== null && typeof a[key] === 'object'
    ? merge(a[key], b[key])
    : b[key]
  }),
  {}))


const MP_REG = /^[mp][trblxy]?$/
export const marginPadding = props => {
  const keys = Object.keys(props)
    .filter(key => MP_REG.test(key))
    .sort()
  const bp = breaks(props)
  const sc = idx([ 'theme', 'space' ], props) || space

  return keys.map(key => {
    const val = props[key]
    const p = getProperties(key)

    if (!Array.isArray(val)) {
      return p.reduce((a, b) => Object.assign(a, {
        [b]: mx(sc)(val)
      }), {})
    }

    return arr(val)
      .map(mx(sc))
      .map(dec(p))
      .map(media(bp))
      .reduce(merge, {})
  }).reduce(merge, {})
}

/* from: jxnblk/styled-system/src/color.js */
const cx = obj => n => idx(getKeys(n), obj) || n
const getKeys = n => typeof n === 'string' ? n.split('.') : [ n ]

const C_REG = /^color|bg$/
const cProperties = {
  bg: 'backgroundColor'
}
export const color = props => {
  const keys = Object.keys(props).filter(key => C_REG.test(key))
  const bp = breaks(props)
  const palette = idx([ 'theme', 'colors' ], props) || {}

  return keys.map(key => {
    const val = props[key]
    const prop = cProperties[key] || key

    if (!Array.isArray(val)) {
      return {
        [prop]: cx(palette)(val)
      }
    }

    return val
      .map(cx(palette))
      .map(dec(prop))
      .map(media(bp))
      .reduce(merge, {})
  }).reduce(merge, {})
}

/* from: jxnblk/styled-system/src/width.js */
const wx = n => !num(n) || n > 1 ? px(n) : (n * 100) + '%'
export const width = props => {
  const n = is(props.width) ? props.width : props.width || props.w
  if (!is(n)) return null

  if (!Array.isArray(n)) {
    return {
      width: wx(n)
    }
  }

  const bp = breaks(props)

  return n
    .map(wx)
    .map(dec('width'))
    .map(media(bp))
    .reduce(merge, {})
}

export const camelToDashCase = s => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

export const stylesToCss = stylesFunc => props => {
  const styleObj = stylesFunc(props)
  if (styleObj === null) return null
  console.log(styleObj)
  return Object.keys(styleObj)
          .map(x => `${camelToDashCase(x)}: ${styleObj[x]};`)
          .join('\n')
}

export const styleMult = (stylesFunc, k) => props => {
  console.log(k)
  const styleObj = stylesFunc(props)
  const value = styleObj[Object.keys(styleObj)[0]]
  const m = /(\d+)px/g.exec(value)
  if (m.length !== 2) {
    throw Error('Invalid pixel definition')
  }
  return `${parseInt(m[1])*k}px`
}
