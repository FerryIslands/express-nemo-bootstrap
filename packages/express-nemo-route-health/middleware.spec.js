const expect = require('chai').expect
const middleware = require('./middleware')

describe('express-nemo-route-health', () => {
  let req = { url: '/api/path' }
  let res = { status: () => res, send: () => {} }

  const next = () => {
    nextCalled = true
  }

  beforeEach(() => {
    nextCalled = false
  })

  context('should be a configurable middleware', () => {
    it('should store middleware options for us to inspect', () => {
      let mw = middleware({ checks: [] })
      expect(mw.options).to.not.be.undefined
    })

    context('defaults', () => {
      it('default responseTemplate if not specified', () => {
        let mw = middleware({ checks: [] })
        expect(mw.options.responseTemplate).to.be.a('function')
      })
    })

    context('overrides', () => {
      let testOptions = {
        responseTemplate: (results, req, res) => 'a response',
        checks: []
      }

      it('override responseTemplate with our own', () => {
        let mw = middleware(testOptions)
        expect(mw.options.responseTemplate).to.be.equal(
          testOptions.responseTemplate
        )
      })
    })

    context('invalid', () => {
      context('when checks is NOT provided', () => {
        it('throws an error', () => {
          expect(() => middleware()).to.throw()
        })
      })

      context('when no responseTemplate is provided', () => {
        it('throws an error', () => {
          expect(() =>
            middleware({
              checks: [],
              responseTemplate: null
            })
          ).to.throw()
        })
      })
    })
  })

  it('should always call next', () => {
    let testOptions = {
      checks: []
    }
    let mw = middleware(testOptions)
    mw(req, res, next)

    expect(nextCalled).to.be.true
  })
})
