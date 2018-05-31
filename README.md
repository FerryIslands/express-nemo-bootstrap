# express-nemo-bootstrap

TM bootstrapper for the express-nemo suite

## Example
This section is for examples in different scenarios.

### Example 1)


Handles following routes:

| Route    | Description                                                        |
| -------- | ------------------------------------------------------------------ |
| /hello   | Log to console and return correlationId in a json back to client   |
| /error   | Throws an error log to console and return a HTTP 500 json response |
| /ping    | Return a json telling i am alive.                                  |
| /health  | Return a status on dependencies as json and HTTP 424 if any failed. |

#### Run
Run our example it would be accessed through http://localhost:4000

```bash
  cd ./examples/example1
  npm i
  npm start
```
