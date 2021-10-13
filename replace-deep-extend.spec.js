const expect = require('chai').expect
const extend = require('deep-extend')
const {merge} = require('lodash')

describe('deep-extend replace with lodash merge', () => {
    it('check if we can exchane', () => {
        defaultConfig = {
            appInsightsConfig: {
              application: 'tm-express-app',
              defaultClient: {
                config: undefined,
                commonProperties: undefined,
                context: undefined
              }
            }
        }

        defaults = {
            application: 'tm-express-app',
            ...defaultConfig
        }
        options= {
            application: 'rename-app',
            appInsightsConfig: {
                defaultClient: {
                    config: 'test'
                }
            }
        }
        optionsExtend = extend({}, defaults, options)
        optionsMerge = merge({}, defaults, options)

        expect(optionsMerge).to.be.deep.equal(optionsExtend)
    })
})
