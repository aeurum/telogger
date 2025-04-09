# Telogger
Telogger can help you log information to Telegram.

## Installation
```
npm i telogger
```

## Usage
```
const Telogger = require('telogger')
// import Telogger from 'telogger'
```

### Basic Setup
```
const telogger = new Telogger('AppTitle', 'BotToken', 'ID')

telogger.dump([ ], { }, 'string', 1234567890)
telogger.trace('started testing telogger')
telogger.debug('third telogger message')
telogger.info('*Telogger* supports _markdown_.')
telogger.warn('*Four* messages sent __in a row__.')
telogger.error('Unfortunately, errors are inevitable.')
telogger.fatal('Something really bad happened. Goodbye!')
```
You can pass `Error` to Telogger as well:
```
try {
  // db.connect()
} catch(error) {
  // telogger.error(error)
  // or
  // telogger.error('Connecting to database failed.', error)
  // or
  telogger.error(new Error('Connecting to database failed.', { cause: error }))
}
```
#### Real Example

##### Code
```
process.on('unhandledRejection', async (reason, promise) => {
  await telogger.fatal('Unhandled rejection.', reason)
  process.exit(1)
})
class UserService {
  async getUser (user) {
    await telogger.trace('Trying to request user info from DB.')
    await telogger.debug(`Current user \`ID\` is \`${user.id}\`.`)
    if (user.is_admin)
      await telogger.info(`Admin *${user.name}* is trying to log in.`)
    if (user.permissions === null) {
      const logMessageHead = [ 'Type Checking' ]
      const logMessageBody = `Permissions of user \`${user.id}\` are \`NULL\`.`
      await telogger.warn(logMessageHead, logMessageBody) && await telogger.dump(user)
    }
    try {
      const userInfo = await this.select(user.id)
    } catch (error) { await telogger.error('Cannot select user.', error) }
  }
}
```

##### Result
<p align="center">

![alt telogger.trace()](https://github.com/aeurum/telogger/blob/main/images/trace-day.png?raw=true)
![alt telogger.debug()](https://github.com/aeurum/telogger/blob/main/images/debug-day.png?raw=true)
![alt telogger.info()](https://github.com/aeurum/telogger/blob/main/images/info-day.png?raw=true)
![alt telogger.warn()](https://github.com/aeurum/telogger/blob/main/images/warn-day.png?raw=true)
![alt telogger.dump()](https://github.com/aeurum/telogger/blob/main/images/dump-day.png?raw=true)
![alt telogger.error()](https://github.com/aeurum/telogger/blob/main/images/error-day.png?raw=true)
![alt telogger.fatal()](https://github.com/aeurum/telogger/blob/main/images/fatal-day.png?raw=true)

</p>

### Advanced Setups
You can assign different channels for different types of logs.
```
const telogger = new Telogger('AppTitle', 'BotToken', {
  dev: 'DevChannelID',  // for `dump`, `trace`, and `debug`
  log: { id: 'LogChannelID', silent: true },  // for `info`
  err: 'ErrChannelID'   // for `warn`, `error`, and `fatal`
})
```
You can also create your own channels and log levels.
```
const telogger = new Telogger('AppTitle', 'BotToken', {
  mychannel: {
    id: 'MyChannelID',
    silent: false,
    sendInProduction: true
  }
}, {
  dump: { to: 'MyID' },
  info: { to: 'MyID' },
  warn: { to: 'MyID' },
  myloglevel: {
    to: 'mychannel',
    icon: '🍑',
    head: '{{text}}',
    body: [ '{{rich}}', '{{location}}' ]
  }
})

telogger.send('myloglevel', 'Head Text', 'Body Rich Text')
```
Below is a list of the defined methods for **your** log levels.
```
telogger.silly()
telogger.test()
telogger.laconic()
telogger.verbose()
telogger.database()
telogger.security()
telogger.network()
telogger.performance()
telogger.request()
telogger.response()
telogger.success()
telogger.failure()
telogger.notice()
telogger.warning()
telogger.alert()
telogger.crit()
telogger.critical()
telogger.emerg()
telogger.emergency()
```

## Docs

### Constructor
At least one of parameters 3 and 4 must not be `null`.

| № | Type | Value | Required |
| --- | --- | --- | --- |
| 1 | `String\|Null` | App title | *Optional* |
| 2 | `String` | Bot token | **Yes** |
| 3 | `Number\|String\|Object\|Null` | ID, username, or `channels` | *Optional* |
| 4 | `Number\|String\|Object\|Null` | ID, username, alias, or `destinations` | *Optional* |

#### Channels
| Key | Type | Value |
| --- | --- | --- |
| [ Alias ] | `Number\|String\|Object` | ID, username, or `channel` |

##### Channel
| Key | Type | Value |
| --- | --- | --- |
| id | `Number\|String` | ID or username |
| silent | `Boolean` | send logs silently |
| sendInProduction | `Boolean` | send logs in production mode |

#### Destinations
| Key | Type | Value |
| --- | --- | --- |
| [ Log Level ] | `String` | ID, username, alias, or `destination` |

##### Destination
| Key | Type | Value |
| --- | --- | --- |
| to | `Number\|String` | ID, username, or alias |
| icon | `String\|False` | `False` to disable icon |
| head | `Template\|Array\|False` | `False` to disable head |
| body | `Template\|Array\|False` | `False` to disable body |
| silent | `Boolean` | send logs silently |
| sendInProduction | `Boolean` | send logs in production mode |

### Templates
Use `{{keyword}}` in your templates to format messages. Below is a list of supported keywords.

| Keyword | Input | Output |
| --- | --- | --- |
| bold | bold | **bold** |
| italic | italic | *italic* |
| underline | underline | <ins>underline</ins> |
| strikethrough | strikethrough | ~~strikethrough~~ |
| spoiler | spoiler | <details><summary>spoiler</summary>spoiler</details> |
| blockquote | blockquote | > blockquote |
| blockquote(1) | expandable blockquote | > expandable blockquote |
| code | code | `code` |
| pre | pre | ```pre``` |
| text | text | text |
| rich | \*\_text\_\* | **_text_** |
| json | [ 'text' ] | [ "text" ] |
| json(0) | [ 'text' ] | ["text"] |
| location |  | ```/src/file.js:8:16``` |
| location(0) |  | ```/src/file.js:8:16``` |
| location(1-2) |  | ```/src/file.js:4:4 /src/file.js:3:3``` |
| location(3+) |  | ```/src/file.js:2:2 /src/file.js:1:1``` |

You can also combine several keywords in your templates (`{{code > location}}`) and use optional blocks (`{{text}?}`).

## Contributing
Contributions are only allowed in TON:
```
UQCYqT9-ycmXE3o57Cac1sM5ntIKdjqIwP3kzWmiZik0VU_b
```
