#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WebappStagingStack } from '../WebappStagingStack';
import { ProductionStack } from '../ProductionStack';
import { StagingStack } from '../StagingStack';

/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
const deployProps: cdk.StackProps = {
  env: { account: '310849459438', region: 'us-east-1' }
};

const app = new cdk.App();

// Command example: cdk deploy --context name=stg-scoutgame
const stackNameParam: string = app.node.getContext('name');

// Sunny awawrds production
if (stackNameParam === 'prd-sunnyawards') {
  new ProductionStack(app, stackNameParam, deployProps, {
    sslCert: 'arn:aws:acm:us-east-1:310849459438:certificate/4618b240-08da-4d91-98c1-ac12362be229'
  });
}
// Scout Game production
else if (stackNameParam === 'prd-scoutgame' || stackNameParam === 'prd-waitlist') {
  new ProductionStack(app, stackNameParam, deployProps, {
    sslCert: 'arn:aws:acm:us-east-1:310849459438:certificate/b901f27e-5a33-4dea-b4fb-39308a580423'
  });
} // Scout Game production
else if (stackNameParam === 'prd-scoutgame') {
  new ProductionStack(app, stackNameParam, deployProps, {
    sslCert: 'arn:aws:acm:us-east-1:310849459438:certificate/b901f27e-5a33-4dea-b4fb-39308a580423'
  });
}
// Connect webapp and api production
else if (stackNameParam.startsWith('prd')) {
  new ProductionStack(app, stackNameParam, deployProps, {
    sslCert: 'arn:aws:acm:us-east-1:310849459438:certificate/b960ff5c-ed3e-4e65-b2c4-ecc64e696902'
  });
} else if (stackNameParam.startsWith('stg-webapp')) {
  new WebappStagingStack(app, stackNameParam, deployProps);
} else if (stackNameParam.startsWith('stg-')) {
  new StagingStack(app, stackNameParam, deployProps);
} else {
  throw new Error('Invalid stack name parameter: ' + stackNameParam);
}
