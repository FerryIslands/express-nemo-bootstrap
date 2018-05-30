const moment = require('moment')

module.exports = options => {
  const notFoundResponse = {
    notFoundResponseTemplate: (req, res) => {
      return {
        error: {
          type: 'http',
          message: 'Not Found',
          details: `No route matching path '${req.url}' was found`,
          http: {
            code: res.statusCode,
            status: 'Not Found'
          }
        }
      }
    }
  }

  const pingResponse = {
    respondToClient: (res, response) => {
      res.json(response)
    },
    responseTemplate: {
      "I'm alive": moment().format()
    }
  }

  const healthResponse = {
    getAllSubSystems: () => {
      return [{name: 'testSystem', status: async () => { return 'OK' }}]
    },

    subSystemTemplate: (name, status) => {
      return { name: name, status: status }
    },

    mainSystemTemplate: (main, subSystems) => {
      let response = {
        status: main.status,
        subSystemStatus: subSystems
      }

      return response
    },
    respondToClient: (res, response) => {
      res.json(response)
    }
  }

  return {
    notFoundResponse: notFoundResponse,
    pingResponse: pingResponse,
    healthResponse: healthResponse
  }
}
