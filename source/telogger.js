import axios from 'axios'
import { ls, ln, md, html } from 'teleform'

export { Telogger }

class Telogger {
  #apiUrl = 'https://api.telegram.org/bot'
  #spacer = '  ››  '

  #replRe = /{{([a-z\(\d\+\-\) >]+)}}/gi
  #funcRe = /at\s+[^\(/)]*\(?/i

  appTitle
  botToken

  channels = {
    dev: {
      id: undefined,
      silent: true,
      sendInProduction: false
    },
    log: {
      id: undefined,
      silent: true,
      sendInProduction: true
    },
    err: {
      id: undefined,
      silent: false,
      sendInProduction: true
    }
  }
  destinations = {
    dump: {
      to: 'dev',
      head: false,
      body: '{{json}}'
    },
    trace: {
      to: 'dev',
      icon: false,
      head: false,
      body: '🮥  {{code}}'
    },
    debug: {
      to: 'dev',
      icon: '🚧',
      body: '{{text}}'
    },
    info: {
      to: 'log',
      icon: '📮',
      body: '{{rich}}'
    },
    warn: {
      to: 'err',
      icon: '⚠️',
      body: '{{rich}}'
    },
    error: {
      to: 'err',
      icon: '🚨',
      head: '{{code > location(0)}}',
      body: '{{text}}'
    },
    fatal: {
      to: 'err',
      icon: '🆘',
      head: '{{code > location(0)}}',
      body: [ '{{text}}', null, '{{pre > location(1+)}}' ]
    }
  }

  constructor(title, token, channels, destinations) {
    Error.stackTraceLimit = 25
    this.appTitle = title
    this.botToken = token
    this.#assign(this.channels, channels, 'channel')
    this.#assign(this.destinations, destinations, 'destination')
  }

  #assign(a, b, n) {
    if (b === undefined || b === null) return
    const [ t, f ] = this.#sample(n)
    if (typeof b === 'object') {
      for (const i in b) {
        if (typeof a[i] !== 'undefined')
          if (typeof b[i] === 'object')
            for (const j in b[i])
              a[i][j] = b[i][j]
          else a[i][t] = b[i]
        else
          if (typeof b[i] === 'object') a[i] = b[i]
          else (a[i] = f) && (a[i][t] = b[i])
      }
    } else for (const i in a) a[i][t] = b
  }
  #sample(n) {
    switch (n) {
      case 'channel':
        return [ 'id', {
          id: undefined,
          silent: true,
          sendInProduction: true
        } ]
      case 'destination':
        return [ 'to', {
          to: undefined,
          body: '{{text}}'
        } ]
    }
  }

  dump(...data) {
    return this.send('dump', data.length === 1 ? data[0] : data)
  }
  trace() { return this.send('trace', ...Object.values(arguments)) }
  debug() { return this.send('debug', ...Object.values(arguments)) }
  info() { return this.send('info', ...Object.values(arguments)) }
  warn() { return this.send('warn', ...Object.values(arguments)) }
  error() { return this.send('error', ...Object.values(arguments)) }
  fatal() { return this.send('fatal', ...Object.values(arguments)) }

  silly() { return this.send('silly', ...Object.values(arguments)) }
  test() { return this.send('test', ...Object.values(arguments)) }
  laconic() { return this.send('laconic', ...Object.values(arguments)) }
  verbose() { return this.send('verbose', ...Object.values(arguments)) }
  database() { return this.send('database', ...Object.values(arguments)) }
  security() { return this.send('security', ...Object.values(arguments)) }
  network() { return this.send('network', ...Object.values(arguments)) }
  performance() { return this.send('performance', ...Object.values(arguments)) }
  request() { return this.send('request', ...Object.values(arguments)) }
  response() { return this.send('response', ...Object.values(arguments)) }
  success() { return this.send('success', ...Object.values(arguments)) }
  failure() { return this.send('failure', ...Object.values(arguments)) }
  notice() { return this.send('notice', ...Object.values(arguments)) }
  warning() { return this.send('warning', ...Object.values(arguments)) }
  alert() { return this.send('alert', ...Object.values(arguments)) }
  crit() { return this.send('crit', ...Object.values(arguments)) }
  critical() { return this.send('critical', ...Object.values(arguments)) }
  emerg() { return this.send('emerg', ...Object.values(arguments)) }
  emergency() { return this.send('emergency', ...Object.values(arguments)) }

  send(name, ...args) {
    const d = this.destinations[name] ?? null
    if (!d || !d?.to) return
    const c = this.channels[d.to] ?? { }
    if (!this.#mustBeSent(d, c)) return
    const chat_id = c?.id ?? d.to
    const icon = d?.icon ?? c?.icon
    const head = this.#template(d, c, 'head')
    const body = this.#template(d, c, 'body')
    if (head === false && body === false) return
    const template = this.#joinTemplate(icon, head, body)
    const text = this.#format(template, args)
    const result = html.to_entities(text, true)
    if (result.text.length === 0) return
    const silent = d?.silent ?? c?.silent ?? true
    this.#sendMessage(chat_id, result.text, result.entities, silent)
  }
  #mustBeSent(d, c) {
    return (
      process.env.NODE_ENV !== 'production' ||
      (d.sendInProduction ?? c.sendInProduction ?? true)
    )
  }
  #template(d, c, n) {
    return d[n] !== undefined ? d[n] : c[n]
  }
  #joinTemplate(icon, head, body) {
    let template = ''
    if (icon !== false) {
      if (icon) {
        template += icon + ls(2)
      }
    }
    if (head !== false) {
      if (this.appTitle) template += html.bold(this.appTitle)
      if (head) {
        if (!Array.isArray(head)) head = [ head ]
        head.unshift('')
        template += head.join(this.#spacer)
      }
    }
    if (body !== false) {
      if (body) {
        if (!Array.isArray(body)) body = [ body ]
        if (head !== false) template += ln(2)
        template += body.join(ln())
      }
    }
    return template
  }
  #format(template, args) {
    let i = 0
    return template.replace(this.#replRe, (full, expr) => {
      const arg = expr.includes('location') ? '' : args[i++]
      if (arg === undefined) return full
      const list = expr.split('>').map(item => item.trim())
      let escape = true
      return list.reverse().reduce((acc, cur) => {
        let result = this.#substitution(cur, acc, escape)
        escape = !result[1]
        return result[0]
      }, arg)
    })
  }
  #substitution(func, text, escape) {
    const regexp =  '(bold|italic|underline|' +
                    'strikethrough|spoiler|' +
                    'blockquote|code|pre|' +
                    'text|rich|json|location)' +
      '(\\s*\\(\\s*(\\d+)\\s*(\\+|\\-)?\\s*(\\d+)?\\s*\\))?'
    const spot = func.match(new RegExp(regexp))
    if (!spot) return [ text, false ]
    if (spot[3] !== undefined) spot[3] = ~~spot[3]
    if (typeof text === 'object' && spot[1] !== 'json')
      if (text?.message) text = text.message
    switch (spot[1]) {
      default: return [ text, false ]
      case 'text': return [ html.escape(text, [ ], escape), true ]
      case 'rich': return [ md.to_html(text), true ]
      case 'json': return [ this.#json(text, spot[3]), false ]
      case 'location':
        return [ this.#location(...spot.slice(3, 6)), false ]
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strikethrough':
      case 'spoiler':
      case 'code':
      case 'pre':
        return [ html[spot[1]](text, null, escape), true ]
      case 'blockquote':
        return [ html[spot[1]](text, spot[3], escape), true ]
    }
  }
  #json(data, pretty = true) {
    return JSON.stringify(data, null, pretty ? 2 : null)
  }
  #location(start, sign, end) {
    let location = new Error()
      .stack
      .split(ln())
      .slice(10)
      .map(line => line.trim())
      .map(line => line.replace(/\)$/, ''))
      .filter(line => !line.includes('node:'))
      .filter(line => !line.endsWith('<anonymous>'))
      .map(line => line.replace(process.cwd(), ''))
      .map(line => line.replace(this.#funcRe, ''))
    if (start === undefined) return location[0]
    if (sign === undefined) return location[start]
    return location.slice(start, end !== undefined ? ++end : end).join(ln())
  }

  #sendMessage(chat_id, text, entities, silent) {
    return this.#request('sendMessage', {
      chat_id,
      text,
      entities,
      link_preview_options: {
        is_disabled: true
      },
      disable_notification: silent
    })
  }
  #request(method, params) {
    axios.post(this.#apiUrl + this.botToken + '/' + method, params).catch(error => console.error(error))
  }
}
