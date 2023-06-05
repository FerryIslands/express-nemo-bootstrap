/* global describe context it beforeEach afterEach */
const { spawn } = require('child_process')
const expect = require('chai').expect
const randomstring = require('randomstring')

describe('logger.js', () => {
  beforeEach(() => {
    process.env.LOGGING_DISABLED = 'false'
  })

  afterEach(() => {
    process.env.LOGGING_DISABLED = 'true'
  })

  const runLoggingAndReadStdOut = (logCall, cb) => {
    const script = `
    const Logger = require('./logger');
    const logger = new Logger();
    ${logCall}
    `

    const child = spawn('node', ['-e', script])

    child.stdout.on('data', (data) => {
      const json = JSON.parse(data.toString())
      cb(json)
    })
  }

  it('should log debug message to stdout', done => {
    const message = randomstring.generate(25)
    const logCall = `logger.debug('${message}');`

    runLoggingAndReadStdOut(logCall, json => {
      expect(isValidDate(json.timestamp)).to.equal(true)
      expect(json.level).to.equal('debug')
      expect(json.message).to.equal(message)
      expect(json.context.origin.name).to.equal('express-nemo-bootstrap')
      expect(json.context.origin.logger).to.equal('logger.js')
      done()
    })
  })

  it('should log info message to stdout', done => {
    const message = randomstring.generate(25)
    const logCall = `logger.info('${message}');`

    runLoggingAndReadStdOut(logCall, json => {
      expect(isValidDate(json.timestamp)).to.equal(true)
      expect(json.level).to.equal('info')
      expect(json.message).to.equal(message)
      expect(json.context.origin.name).to.equal('express-nemo-bootstrap')
      expect(json.context.origin.logger).to.equal('logger.js')
      done()
    })
  })

  it('should log warn message to stdout', done => {
    const message = randomstring.generate(25)
    const logCall = `logger.warn('${message}');`

    runLoggingAndReadStdOut(logCall, json => {
      expect(isValidDate(json.timestamp)).to.equal(true)
      expect(json.level).to.equal('warn')
      expect(json.message).to.equal(message)
      expect(json.context.origin.name).to.equal('express-nemo-bootstrap')
      expect(json.context.origin.logger).to.equal('logger.js')
      done()
    })
  })

  it('should log error message to stderr', done => {
    const message = randomstring.generate(25)
    const logCall = `logger.error('${message}');`

    runLoggingAndReadStdOut(logCall, json => {
      expect(isValidDate(json.timestamp)).to.equal(true)
      expect(json.level).to.equal('error')
      expect(json.message).to.equal(message)
      expect(json.context.origin.name).to.equal('express-nemo-bootstrap')
      expect(json.context.origin.logger).to.equal('logger.js')
      done()
    })
  })

  describe('logging structured message', () => {
    let result

    const logDebugReturnData = (data, done) => {
      const logCall = `logger.debug(${JSON.stringify(data)});`
      runLoggingAndReadStdOut(logCall, json => {
        result = json
        done()
      })
      return data
    }

    context('missing default data', () => {
      beforeEach((done) => {
        logDebugReturnData({}, done)
      })

      it('should log with level debug', done => {
        expect(result.level).to.equal('debug')
        done()
      })

      it('should log with timestamp', async () => {
        expect(isValidDate(result.timestamp)).to.equal(true)
      })

      it('should log message', async () => {
        expect(result.message).to.equal('')
      })

      it('should add origin:name', async () => {
        expect(result.context.origin.name).to.equal('express-nemo-bootstrap')
      })

      it('should add origin:logger', async () => {
        expect(result.context.origin.logger).to.equal('logger.js')
      })
    })

    context('overriding default data', () => {
      let data

      beforeEach((done) => {
        data = logDebugReturnData({
          level: randomstring.generate(10),
          timestamp: randomstring.generate(10),
          message: randomstring.generate(100),
          context: {
            origin: {
              name: randomstring.generate(25),
              logger: randomstring.generate(20)
            }
          }
        }, done)
      })

      it('should not allow override of level debug', async () => {
        expect(result.level).to.equal('debug')
      })

      it('should not allow override of timestamp', async () => {
        expect(isValidDate(result.timestamp)).to.equal(true)
      })

      it('should log message', async () => {
        expect(result.message).to.equal(data.message)
      })

      it('should override origin:name', async () => {
        expect(result.context.origin.name).to.equal(data.context.origin.name)
      })

      it('should override origin:logger', async () => {
        expect(result.context.origin.logger).to.equal(
          data.context.origin.logger
        )
      })
    })

    context('partially overriding default data', () => {
      let data

      beforeEach((done) => {
        data = logDebugReturnData({
          context: {
            origin: {
              name: randomstring.generate(25)
            }
          }
        }, done)
      })

      it('should override origin:name', async () => {
        expect(result.context.origin.name).to.equal(data.context.origin.name)
      })

      it('should use default origin:logger', async () => {
        expect(result.context.origin.logger).to.equal('logger.js')
      })
    })

    context('extending context', () => {
      let data

      beforeEach((done) => {
        data = logDebugReturnData({
          context: {
            custom: {
              foo: { name: randomstring.generate(25) }
            }
          }
        }, done)
      })

      it('should should not remove context:origin', async () => {
        expect(result.context).to.have.property('origin')
      })

      it('should add context:custom', async () => {
        expect(result.context.custom).to.deep.equal(data.context.custom)
      })
    })

    context('logging event', () => {
      let data

      beforeEach((done) => {
        data = logDebugReturnData({
          event: {
            custom: {
              test: {
                foo: randomstring.generate(50)
              }
            }
          }
        }, done)
      })

      it('should add event', async () => {
        expect(result.event.custom).to.deep.equal(data.event.custom)
      })
    })
  })
})

function isValidDate (d) {
  return !isNaN(Date.parse(d))
}
