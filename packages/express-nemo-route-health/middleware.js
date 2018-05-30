const defaults = {
  mainSystemTemplate: (main, subSystems) => {
    let response = `status: ${main.status}\n`
    response += subSystems.join()
    return response
  },
  subSystemTemplate: (name, status) => {
    return `name: ${name} status: ${status}\n`
  },
  respondToClient: (res, response) => {
    res.send(response)
  }
}

module.exports = options => {
  options = { ...defaults, ...options }

  if (!options.getAllSubSystems || typeof options.getAllSubSystems !== 'function') {
    throw new Error('[Options] Missing getAllSubSystems function')
  }

  if (!options.mainSystemTemplate || typeof options.mainSystemTemplate !== 'function') {
    throw new Error('[Options] Missing mainSystemTemplate function')
  }

  if (!options.subSystemTemplate || typeof options.subSystemTemplate !== 'function') {
    throw new Error('[Options] Missing subSystemTemplate function')
  }

  if (!options.respondToClient || typeof options.respondToClient !== 'function') {
    throw new Error('[Options] Missing respondToClient function')
  }

  const middleware = async (req, res, next) => {
    // Fetch status
    let subSystemsStatus = []
    for (let subSystem of options.getAllSubSystems()) {
      subSystemsStatus.push({name: subSystem.name, status: await subSystem.status()})
    }

    // Build client response
    const systemInfo = {status: subSystemsStatus.every(subsystem => subsystem.status === 'OK') ? 'OK' : 'Failure'}

    let subSystemsStatusTemplateData = []
    for (let subSystem of subSystemsStatus) {
      subSystemsStatusTemplateData.push(
        options.subSystemTemplate(subSystem.name, subSystem.status)
      )
    }
    const response = options.mainSystemTemplate(systemInfo, subSystemsStatusTemplateData)

    // Send to client
    res.statusCode = systemInfo.status === 'OK' ? 200 : 424
    options.respondToClient(res, response)

    next()
  }

  middleware.options = options
  return middleware
}
