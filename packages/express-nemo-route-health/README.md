# express-nemo-route-health

A middleware for express to add a route that handles health route in an api.

If any subsystem has a status of Failure it will respond with HTTP 424 - FAILED DEPENDENCY.

## Options

| Name                | Required | Default value | Description                                                                                                 |
| ------------------- | -------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| getAllSubSystems    | true     | undefined     | a function that returns an array of subsystem name: string,  status: async function                         |
| mainSystemTemplate  | -        | function      | a function that receives a status (OK/Failure) and an array based on subSystemTemplate it returns an string |
| subSystemTemplate   | -        | function      | a function that receives subsystem name and its status, returns a string                                    |
| respondToClient     | -        | function      | a function that receives res object and the string produced from mainSystemTemplate                         |
