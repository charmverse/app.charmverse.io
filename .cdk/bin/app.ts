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

// Command example: cdk deploy --context name=stg-connect
const stackNameParam: string = app.node.getContext('name');

// Connect production
if (stackNameParam.startsWith('prd')) {
  new ProductionStack(app, stackNameParam, deployProps);
}
// Connect staging
else if (stackNameParam.startsWith('stg-connect')) {
  new ConnectStagingStack(app, stackNameParam, deployProps);
}
// Webapp staging
else if (stackNameParam.startsWith('stg-webapp')) {
  new WebappStagingStack(app, stackNameParam, deployProps);
} else {
  throw new Error('Invalid stack name parameter: ' + stackNameParam);
}
