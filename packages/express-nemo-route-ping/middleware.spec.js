const expect = require('chai').expect
const middleware = require('./middleware')

describe('express-nemo-route-ping', () => {
  context('configuration', () => {
    context('invalid', () => {
      context('when no response template is provided', () => {
        it('throws an error', () => {
          expect(() =>
            middleware({
              responseTemplate: null
            })
          ).to.throw()
        })
      })
    })

    context('valid', () => {
      context('minimum configuration', () => {
        it('returns middleware with options exposed', () => {
          let mw = middleware()
          expect(mw.options).to.not.be.undefined
        })
      })
    })
  })

  context('middleware is called', () => {
    let nextCalled
    let callArgs
    let sendCalled
    let SUT
    let req = {}
    let res = {
      statusCode: 200,
      send: data => {
        sendCalled = true
        return res
      },
      status: code => {
        res.statusCode = code
        return res
      }
    }

    const next = () => {
      nextCalled = true
    }

    beforeEach(() => {
      nextCalled = false
      sendCalled = false
      SUT = middleware()
    })

    it('calls next', () => {
      SUT(req, res, next)
      expect(nextCalled).to.be.true
    })

    it('passes 200 as status code', () => {
      SUT(req, res, next)
      expect(res.statusCode).to.equal(200)
    })

    it('passes clientResponse to client', () => {
      SUT(req, res, next)
      expect(sendCalled).to.equal(true)
    })

    it('calls the respondToClient with response and responseData', () => {
      let calledCorrectly

      mw = middleware({
        responseTemplate: (request, response) =>
          (calledCorrectly = request === req && response === res)
      })
      mw(req, res, next)
      expect(calledCorrectly).to.be.true
    })
  })
})
