# express-nemo-route-health

A middleware for express to add a route that handles health route in an api.

If any subsystem has a status of Failure it will respond with HTTP 424 - FAILED DEPENDENCY.

## Options

| Name             | Required | Default value | Description                                                                                         |
| ---------------- | -------- | ------------- | --------------------------------------------------------------------------------------------------- |
| responseTemplate |          | function      | A function receiving the request and response object, returning a response to message to send back. |
| checks           | yes      |               | An array of checks to perform when the health route is called                                       |

## Checks

| Name  | Required | Default value | Description                               |
| ----- | -------- | ------------- | ----------------------------------------- |
| name  | yes      |               | The name of the healthcheck               |
| check | yes      |               | An async function returning OK or Failure |

### Example check

```js
{
  name: 'mongo-db',
  check: async () => {
    return 'OK'
  }
}
```
