#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DefaultStagingStack } from '../charmverse-staging-stack';
import { ConnectAppStagingStack } from '../connect-staging-stack';

const app = new cdk.App();

const stackName = 'stg-charmverse-' + process.env.STAGE;

const account = '310849459438';
const region = 'us-east-1';

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
const deployProps: cdk.StackProps = {
  env: { account, region }
};

var deployedStack;

if (process.env.DEPLOYED_APP === 'connect') {
  deployedStack = new ConnectAppStagingStack({ scope: app, id: stackName, props: deployProps });
} else {
  deployedStack = new DefaultStagingStack({ scope: app, id: stackName, props: deployProps });
}