const expect = require('chai').expect
const middleware = require('./middleware')

describe('express-nemo-route-health', () => {
  let req = { url: '/api/path' }
  let res = {send: () => {}}
  const next = () => {
    nextCalled = true
  }

  beforeEach(() => {
    nextCalled = false
  })

  context('should be a configurable middleware', () => {
    let testOptions = {getAllSubSystems: () => []}

    it('should store middleware options for us to inspect', () => {
      let mw = middleware(testOptions)
      expect(mw.options).to.not.be.undefined
    })

    context('defaults', () => {
      it('default mainSystemTemplate if no one is specified', () => {
        let mw = middleware(testOptions)
        expect(mw.options.mainSystemTemplate).to.be.a('function')
      })

      it('default subSystemTemplate if no one is specified', () => {
        let mw = middleware(testOptions)
        expect(mw.options.subSystemTemplate).to.be.a('function')
      })

      it('default respondToClient if no one is specified', () => {
        let mw = middleware(testOptions)
        expect(mw.options.respondToClient).to.be.a('function')
      })
    })

    context('overrides', () => {
      testOptions = {
        getAllSubSystems: () => [],
        mainSystemTemplate: (main, subSystems) => 'TEST mainSystemTemplate',
        subSystemTemplate: (name, status) => 'TEST subSystemTemplate',
        respondToClient: (res, response) => 'TEST respondToClient'
      }
      it('override mainSystemTemplate with our own', () => {
        let mw = middleware(testOptions)
        expect(mw.options.mainSystemTemplate).to.be.equal(testOptions.mainSystemTemplate)
      })

      it('override subSystemTemplate with our own', () => {
        let mw = middleware(testOptions)
        expect(mw.options.subSystemTemplate).to.be.equal(testOptions.subSystemTemplate)
      })

      it('override respondToClient with our own', () => {
        let mw = middleware(testOptions)
        expect(mw.options.respondToClient).to.be.equal(testOptions.respondToClient)
      })
    })

    context('invalid', () => {
      context('when getAllSubSystems is NOT provided', () => {
        it('throws an error', () => {
          expect(() =>
            middleware()
          ).to.throw()
        })
      })
      context('when no mainSystemTemplate is provided', () => {
        it('throws an error', () => {
          expect(() =>
            middleware({
              getAllSubSystems: () => [],
              mainSystemTemplate: null
            })
          ).to.throw()
        })
      })

      context('when no subSystemTemplate is provided', () => {
        it('throws an error', () => {
          expect(() =>
            middleware({
              getAllSubSystems: () => [],
              subSystemTemplate: null
            })
          ).to.throw()
        })
      })

      context('when no respondToClient is provided', () => {
        it('throws an error', () => {
          expect(() =>
            middleware({
              getAllSubSystems: () => [],
              respondToClient: null
            })
          ).to.throw()
        })
      })
    })
  })

  it('should always call next', () => {
    let testOptions = {getAllSubSystems: () => []}
    let mw = middleware(testOptions)
    mw(req, res, next)

    expect(nextCalled).to.be.true
  })
})
