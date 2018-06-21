/* global describe context it beforeEach afterEach */

const expect = require('chai').expect
const sinon = require('sinon')
const moment = require('moment')
const randomstring = require('randomstring')

const Logger = require('./logger')

const logger = new Logger()

describe('logger.js', () => {
  beforeEach(() => {
    process.env.LOGGING_DISABLED = 'false'
  })

  afterEach(() => {
    process.env.LOGGING_DISABLED = 'true'
  })

  const captureConsole = (method, cb) => {
    const sandbox = sinon.sandbox.create()
    const consoleStub = sandbox.stub(console, method)
    cb()
    const captured = consoleStub.getCall(0).args[0]
    sandbox.restore()
    return JSON.parse(captured)
  }

  it('should log debug message to stdout', done => {
    const message = randomstring.generate(25)
    const json = captureConsole('log', () => {
      logger.debug(message)
    })

    let momentTimestamp = moment(json.timestamp, moment.ISO_8601, true)
    expect(momentTimestamp.isValid()).to.equal(true)
    expect(json.level).to.equal('debug')
    expect(json.message).to.equal(message)
    expect(json.context.origin.name).to.equal('express-nemo-bootstrap')
    expect(json.context.origin.logger).to.equal('logger.js')
    done()
  })

  it('should log info message to stdout', done => {
    const message = randomstring.generate(25)
    const json = captureConsole('log', () => {
      logger.info(message)
    })

    let momentTimestamp = moment(json.timestamp, moment.ISO_8601, true)
    expect(momentTimestamp.isValid()).to.equal(true)
    expect(json.level).to.equal('info')
    expect(json.message).to.equal(message)
    expect(json.context.origin.name).to.equal('express-nemo-bootstrap')
    expect(json.context.origin.logger).to.equal('logger.js')
    done()
  })

  it('should log warn message to stdout', done => {
    const message = randomstring.generate(25)
    const json = captureConsole('log', () => {
      logger.warn(message)
    })

    let momentTimestamp = moment(json.timestamp, moment.ISO_8601, true)
    expect(momentTimestamp.isValid()).to.equal(true)
    expect(json.level).to.equal('warn')
    expect(json.message).to.equal(message)
    expect(json.context.origin.name).to.equal('express-nemo-bootstrap')
    expect(json.context.origin.logger).to.equal('logger.js')
    done()
  })

  it('should log error message to stderr', done => {
    const message = randomstring.generate(25)
    const json = captureConsole('error', () => {
      logger.error(message)
    })

    let momentTimestamp = moment(json.timestamp, moment.ISO_8601, true)
    expect(momentTimestamp.isValid()).to.equal(true)
    expect(json.level).to.equal('error')
    expect(json.message).to.equal(message)
    expect(json.context.origin.name).to.equal('express-nemo-bootstrap')
    expect(json.context.origin.logger).to.equal('logger.js')
    done()
  })

  describe('logging structured message', () => {
    let result

    const logDebugReturnData = data => {
      result = captureConsole('log', () => {
        logger.debug(data)
      })
      return data
    }

    context('missing default data', () => {
      beforeEach(() => {
        logDebugReturnData({})
      })

      it('should log with level debug', done => {
        expect(result.level).to.equal('debug')
        done()
      })

      it('should log with timestamp', async () => {
        let momentTimestamp = moment(result.timestamp, moment.ISO_8601, true)
        expect(momentTimestamp.isValid()).to.equal(true)
      })

      it('should log message', async () => {
        expect(result.message).to.equal('Missing message!')
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

      beforeEach(() => {
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
        })
      })

      it('should not allow override of level debug', async () => {
        expect(result.level).to.equal('debug')
      })

      it('should not allow override of timestamp', async () => {
        let momentTimestamp = moment(result.timestamp, moment.ISO_8601, true)
        expect(momentTimestamp.isValid()).to.equal(true)
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

      beforeEach(() => {
        data = logDebugReturnData({
          context: {
            origin: {
              name: randomstring.generate(25)
            }
          }
        })
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

      beforeEach(() => {
        data = logDebugReturnData({
          context: {
            custom: {
              foo: { name: randomstring.generate(25) }
            }
          }
        })
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

      beforeEach(() => {
        data = logDebugReturnData({
          event: {
            custom: {
              test: {
                foo: randomstring.generate(50)
              }
            }
          }
        })
      })

      it('should add event', async () => {
        expect(result.event.custom).to.deep.equal(data.event.custom)
      })
    })
  })
})
