# express-nemo-bootstrap

TM bootstrapper for the express-nemo suite

## Update projects that dependends on nemo-express-bootstrap

Run this scipt after you have tagged a new release with vX.Y.Z and pushed it with 'git push --tags'

### Prereq

You need to update script variables in the top of the script: update-projects-dependency.sh

* newVersion='vX.Y.Z', set a valid version
* featureId='SET PBI ITEM', set the PBI number taht we should reference
* [optional] add/remove projects from 'projectWithNemoBootstrap' dont forget to add/remove corresponding item index in 'projectPackageManager'

### Run it

````bash
express-nemo-bootstrap>

./update-projects-dependency.sh
````

### What will the script do

It will create pull requests with the new version of express-nemo-bootstrap based on each projects master branch.

Projects that will be affected:

* tm-internal-api
* tm-capacity-api-v2
* tm-nemo-api
* tm-price-api
* tm-competitor-price-api
* tm-task-api
* tm-monetary-api

At the end it will output links to all created pull requests

## Application Insights

Setting up Appplication Insights in express-nemo-bootstrap

### Enabling Application Insights

exporting environment variable __AI_INSTRUMENTATION_KEY__.

### Customization on request

Each request coming to the server have the  __req.context.appInsights__ which can be used to setup for example a [Telementryclient](https://docs.microsoft.com/en-us/azure/azure-monitor/app/nodejs#telemetryclient-api)

Example, cusomize on single request)

```js
  yourOwnEndpoint(req, res) {
    const client = req.context.appInsights.defaultClient

    client.trackEvent({name: "my custom event", properties: {customProperty: "custom property value"}});
    client.trackNodeHttpRequest({request: req, response: res}); // Place at the beginning of your request handler
    ...
  }

````

Example, add a custom property to all events)

[Article about Custom Properties in Azure Portal](https://camerondwyer.com/2020/05/26/how-to-use-application-insights-custom-properties-in-azure-monitor-log-kusto-queries/)

```js
  import * as nemo from "express-nemo-bootstrap";
  const createRouter = require("./router");

  async function main() {
    nemo({
      application: "tm-my-api",
      basePath: "/api/my/",
      appInsightsConfig: {
        defaultClient: {
          commonProperties: {
            myEnvVar: process.env.MY_ENV_VAR
          }
      },
      healthchecks: []
    }).serve(async (server, middlewares) => {
      const serviceRouter = await createRouter(middlewares);

      server.use(serviceRouter);
    });
  }

  main();
````

### Customization on startup

When we have something we need to apply to all requests

```js
  import * as nemo from "express-nemo-bootstrap";
  const createRouter = require("./router");

  async function main() {
    nemo({
      application: "tm-my-api",
      basePath: "/api/my/",
      healthchecks: []
    }).serve(async (server, middlewares) => {
      const serviceRouter = await createRouter(middlewares);

      // Configure appInsights on startup
      const appInsights = middlewares.dependencies.appInsights
      const client = middlewares.dependencies.appInsights.defaultClient
      client.trackEvent({name: "my custom event", properties: {customProperty: "custom property value"}});

      server.use(serviceRouter);
    });
  }

  main();
````

## Verifying api integration

The repository contains a verification script tests for successful api integration/setup on a very basic level.
Test includes header checks, ping and health endpoint checks, 404 handling etc.

### Running the verification script

```bash
./scripts/verify <url>
```

The url should be substituted with the full url to the api you want to run the checks agains (i.e. <http://localhost:4000/api/internal>).

## Example

This section is for examples in different scenarios.

### Example 1)

Handles following routes:

| Route   | Description                                                         |
| ------- | ------------------------------------------------------------------- |
| /hello  | Log to console and return correlationId in a json back to client    |
| /error  | Throws an error log to console and return a HTTP 500 json response  |
| /ping   | Return a json telling i am alive.                                   |
| /health | Return a status on dependencies as json and HTTP 424 if any failed. |

#### Run

Run our example it would be accessed through <http://localhost:4000>

```bash
  cd ./examples/example1
  npm i
  npm start
```
