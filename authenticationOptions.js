const jwksOptions = {
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: 'https://nem0.eu.auth0.com/.well-known/jwks.json'
}

// Validate the audience and the issuer.
const validationOptions = {
  audience: 'https://nemo.stena.io/api',
  issuer: 'https://nem0.eu.auth0.com/',
  algorithms: ['RS256']
}

module.exports = {
  jwksOptions,
  validationOptions
}
