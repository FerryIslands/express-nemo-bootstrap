# express-nemo-route-ping

A middleware for express to add a route that handles ping route in an api.

## Options

| Name               | Required | Default value | Description                                                                              |
| ------------------ | -------- | ------------- | ---------------------------------------------------------------------------------------- |
| responseTemplate   |          | string        | the string telling us we are alive.                                                      |
| respondToClient    |          | func          | a function that receives a res object and response string that should be sent to client. |
