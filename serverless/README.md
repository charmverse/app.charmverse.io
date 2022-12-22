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
$ serverless deploy
```
