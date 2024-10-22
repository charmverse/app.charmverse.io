# Charmverse's Serverless setup

## Usage

### Test

In order to build the functions you can run

```
$ serverless package
```

It will use esbuild and compile all the TS files into a minified bundle ready to be deployed.

### Deployment

In order to deploy the serverless environment, you need to run the following command:

```
$ serverless deploy     # staging/dev worker
$ serverless deploy --stage prod     # production
```

### Functions

Two functions are currently deployed.

`worker.ts`

One is a SQS worker in charge of executing and handling messages in the SQS queue. This one signs the payload of the webhook and call our user's API with the signature + payload.

The webhook expects a 200 response back. If this isn't successful, the message goes back to the queue and is executed up to 5 times with a delay between each execution.

`checker.ts`

This one is a simple HTTP POST endpoint returning a 200 success message and logging the header and payload for debugging and test purposes.
