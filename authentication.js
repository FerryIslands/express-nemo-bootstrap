const jwt = require('jsonwebtoken')
const { jwksOptions, validationOptions } = require('./authenticationOptions')
const { JwksClient } = require('jwks-rsa')

async function authenticate(authorization){
  if(typeof  authorization !== 'string') {
    throw new Error('Input must be a string')
  }
  
  const split = authorization.split(' ');
  if (split.length !== 2) {
    throw new Error('Format is Bearer [token]')
  }
  
  const scheme = split[0];
  if (!/^Bearer$/i.test(scheme)) {
    throw new Error('Format is Bearer [token]')
  }
  const token = split[1];
  
  let decodedToken;
  try {
    decodedToken = jwt.decode(token, { complete: true });
  } catch(err) {
    throw new Error(err)
  }
  
  const header = decodedToken?.header;
  
  if (!header) {
    throw new Error('Could not decode jwt, check if token is correct');
  }
  
  const client = new JwksClient(jwksOptions);

  const key = await client.getSigningKey(header.kid);
  
  const publicKey = key.publicKey || key.rsaPublicKey;
  
  try {
    jwt.verify(token, publicKey, validationOptions)
  } catch(err) {
    throw new Error('Could not verify jwt, check if token is correct');
  }
  
  return {
    user: decodedToken.payload
  }
}

module.exports = {
  authenticate
}
