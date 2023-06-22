/* global describe it */

const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const sinon = require('sinon')

const authentication = require('./authentication')
const { JwksClient } = require('jwks-rsa')

// Fake token with header and payload:
//   "alg": "RS256",
//   "typ": "JWT",
//   "kid": "abc123"
//
//   "iss": "https://nem0.eu.auth0.com/",
//   "iat": 946684800,
//   "exp": 32503680000,
//   "aud": "https://nemo.stena.io/api",
//   "sub": "samlp|AzureViaSaml|nemo.test@stenaline.com",
//   "https://nemo.stena.io/windowsaccountname": "LINE\\nemtes"
const validToken = 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFiYzEyMyJ9.eyJpc3MiOiJodHRwczovL25lbTAuZXUuYXV0aDAuY29tLyIsImlhdCI6OTQ2Njg0ODAwLCJleHAiOjMyNTAzNjgwMDAwLCJhdWQiOiJodHRwczovL25lbW8uc3RlbmEuaW8vYXBpIiwic3ViIjoic2FtbHB8QXp1cmVWaWFTYW1sfG5lbW8udGVzdEBzdGVuYWxpbmUuY29tIiwiaHR0cHM6Ly9uZW1vLnN0ZW5hLmlvL3dpbmRvd3NhY2NvdW50bmFtZSI6IkxJTkVcXG5lbXRlcyJ9.n7OlW44wb9ZEJ4338FxNDA7FJr0SLvbiUeiIPd5cvj1eDp6Vzvnaulvryvpo11XmMkr7b9nyZhHvaFlltyFNaCT8CJjZeOhYPoSaYg88Evp_BVUceMSqo8abdYIMsbEN-_JKZ4mqKpqkcnDHd2KCzfhE_aRYwntx3_q6wvXWWaWeYs092a9lEVGOeRWj0_MuS1ltGQaT40y4JIrQpQbE04c827IAPHQRSNAym8_xph0x9qxDM7ZK2dqvazXjua_hwG3T-lCl1Rar0ahO0HnV2G24xPW4om2-SsTvC9U8Rhmgve3bOVI_YCb3pcAXhcX2beXjPneONYxc13k7dTN84w'
// private key for the fake token
const validKey = '-----BEGIN PRIVATE KEY-----\n' +
  'MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC7VJTUt9Us8cKj\n' +
  'MzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu\n' +
  'NMoSfm76oqFvAp8Gy0iz5sxjZmSnXyCdPEovGhLa0VzMaQ8s+CLOyS56YyCFGeJZ\n' +
  'qgtzJ6GR3eqoYSW9b9UMvkBpZODSctWSNGj3P7jRFDO5VoTwCQAWbFnOjDfH5Ulg\n' +
  'p2PKSQnSJP3AJLQNFNe7br1XbrhV//eO+t51mIpGSDCUv3E0DDFcWDTH9cXDTTlR\n' +
  'ZVEiR2BwpZOOkE/Z0/BVnhZYL71oZV34bKfWjQIt6V/isSMahdsAASACp4ZTGtwi\n' +
  'VuNd9tybAgMBAAECggEBAKTmjaS6tkK8BlPXClTQ2vpz/N6uxDeS35mXpqasqskV\n' +
  'laAidgg/sWqpjXDbXr93otIMLlWsM+X0CqMDgSXKejLS2jx4GDjI1ZTXg++0AMJ8\n' +
  'sJ74pWzVDOfmCEQ/7wXs3+cbnXhKriO8Z036q92Qc1+N87SI38nkGa0ABH9CN83H\n' +
  'mQqt4fB7UdHzuIRe/me2PGhIq5ZBzj6h3BpoPGzEP+x3l9YmK8t/1cN0pqI+dQwY\n' +
  'dgfGjackLu/2qH80MCF7IyQaseZUOJyKrCLtSD/Iixv/hzDEUPfOCjFDgTpzf3cw\n' +
  'ta8+oE4wHCo1iI1/4TlPkwmXx4qSXtmw4aQPz7IDQvECgYEA8KNThCO2gsC2I9PQ\n' +
  'DM/8Cw0O983WCDY+oi+7JPiNAJwv5DYBqEZB1QYdj06YD16XlC/HAZMsMku1na2T\n' +
  'N0driwenQQWzoev3g2S7gRDoS/FCJSI3jJ+kjgtaA7Qmzlgk1TxODN+G1H91HW7t\n' +
  '0l7VnL27IWyYo2qRRK3jzxqUiPUCgYEAx0oQs2reBQGMVZnApD1jeq7n4MvNLcPv\n' +
  't8b/eU9iUv6Y4Mj0Suo/AU8lYZXm8ubbqAlwz2VSVunD2tOplHyMUrtCtObAfVDU\n' +
  'AhCndKaA9gApgfb3xw1IKbuQ1u4IF1FJl3VtumfQn//LiH1B3rXhcdyo3/vIttEk\n' +
  '48RakUKClU8CgYEAzV7W3COOlDDcQd935DdtKBFRAPRPAlspQUnzMi5eSHMD/ISL\n' +
  'DY5IiQHbIH83D4bvXq0X7qQoSBSNP7Dvv3HYuqMhf0DaegrlBuJllFVVq9qPVRnK\n' +
  'xt1Il2HgxOBvbhOT+9in1BzA+YJ99UzC85O0Qz06A+CmtHEy4aZ2kj5hHjECgYEA\n' +
  'mNS4+A8Fkss8Js1RieK2LniBxMgmYml3pfVLKGnzmng7H2+cwPLhPIzIuwytXywh\n' +
  '2bzbsYEfYx3EoEVgMEpPhoarQnYPukrJO4gwE2o5Te6T5mJSZGlQJQj9q4ZB2Dfz\n' +
  'et6INsK0oG8XVGXSpQvQh3RUYekCZQkBBFcpqWpbIEsCgYAnM3DQf3FJoSnXaMhr\n' +
  'VBIovic5l0xFkEHskAjFTevO86Fsz1C2aSeRKSqGFoOQ0tmJzBEs1R6KqnHInicD\n' +
  'TQrKhArgLXX4v3CddjfTRJkFWDbE/CkvKZNOrcf1nhaGCPspRJj2KUkj1Fhl9Cnc\n' +
  'dn/RsYEONbwQSjIfMPkvxF+8HQ==\n' +
  '-----END PRIVATE KEY-----'

describe('authentication.js', () => {
  it('should error on non-string', async () => {
    await expect(authentication.authenticate({ authorization: validToken })).to.be.rejectedWith(Error)
  })

  it('should error on length not equal to 2', async () => {
    await expect(authentication.authenticate(validToken + ' someExtra')).to.be.rejectedWith(Error)
  })

  it('should error on other schemas than Bearer', async () => {
    const invalidToken = 'Basic ' + validToken.split(' ')[1]
    await expect(authentication.authenticate(invalidToken)).to.be.rejectedWith(Error)
  })

  it('should error on invalid jwt', async () => {
    const invalidToken = 'Bearer something.thatisnot.ajwttoken'
    await expect(authentication.authenticate(invalidToken)).to.be.rejectedWith(Error)
  })

  describe('passing', () => {
    it('should return user on valid input', async () => {
      sinon.stub(JwksClient.prototype, 'getSigningKey').callsFake(async (kid) => {
        if (kid === 'abc123') {
          return {
            publicKey: validKey
          }
        }
        return {
          publicKey: 'invalidKey'
        }
      })

      const auth2 = require('./authentication')

      const res = await auth2.authenticate(validToken)

      expect(res.user.sub).to.be.equal('samlp|AzureViaSaml|nemo.test@stenaline.com')
      expect(res.user['https://nemo.stena.io/windowsaccountname']).to.be.equal('LINE\\nemtes')
    })
  })
})
