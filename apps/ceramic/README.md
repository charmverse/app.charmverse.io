# Ceramic connectivity

This folder contains all the files needed to connect to a Ceramic node.

This folder is fully standalone and does not need to be imported to other parts of the app.

Any interactions will happen via the graphql server bootstrapped in run-deploy.ts

## credentials.gql

Defines the model we will be using to store the credentials.

## deploy-composites.ts

This file contains the code to deploy the composites to the Ceramic node.

It converts the graphql schema definition into json and runtime js stored inside the /generated folder.

## run-deploy.ts

Execute script inside deploy-composites.ts against the remote ceramic node to index targeted models.

Startup a graphql server that can be used to read from and write to the ceramic node.

## package.json

There is currently an issue with a sub-dependency of the graphql @ceramicnetwork/streamid/node_modules/multiformats library that causes the build to fail.
The package.json file sets the filetype as ESM so that all files locally are treated as esmodules without interfering with the rest of the app.

```

```
