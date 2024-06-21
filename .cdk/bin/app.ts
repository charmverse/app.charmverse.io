#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WebappStagingStack } from '../WebappStagingStack';
import { ConnectStagingStack } from '../ConnectStagingStack';
import { ProductionStack } from '../ProductionStack';

/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
const deployProps: cdk.StackProps = {
  env: { account: '310849459438', region: 'us-east-1' }
};

const app = new cdk.App();

// Command example: cdk deploy --context stack=stg-connect
const stackParam: string = app.node.getContext('stack');
const stackNameParam: string = app.node.getContext('name');

// Connect production
if (stackParam === 'prd-connect') {
  new ProductionStack(app, stackNameParam, deployProps);
}
// Connect staging
else if (stackParam === 'stg-connect') {
  new ConnectStagingStack(app, stackNameParam, deployProps);
}
// Webapp staging
else if (stackParam === 'stg-webapp') {
  new WebappStagingStack(app, stackNameParam, deployProps);
} else {
  throw new Error('Invalid stack parameter: ' + stackParam);
}
