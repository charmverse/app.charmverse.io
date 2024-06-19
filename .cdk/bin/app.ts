#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WebappStagingStack } from '../WebappStagingStack';
import { ConnectStagingStack } from '../ConnectStagingStack';

/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
const deployProps: cdk.StackProps = {
  env: { account: '310849459438', region: 'us-east-1' }
};

const stacks = ['stg-webapp', 'stg-connect', 'prd-connect'] as const;

const app = new cdk.App();

const stackParam: (typeof stacks)[number] = app.node.tryGetContext('stack');

if (!stacks.includes(stackParam)) {
  throw new Error('Invalid stack or stackEnv parameter: ' + stackParam);
}

if (stackParam === 'prd-connect') {
  new ConnectStagingStack(app, 'prd-connect', deployProps);
} else if (stackParam === 'stg-connect') {
  new ConnectStagingStack(app, 'stg-connect-' + process.env.STAGE, deployProps);
} else if (stackParam === 'stg-webapp') {
  new WebappStagingStack(app, 'stg-webapp-' + process.env.STAGE, deployProps);
}
