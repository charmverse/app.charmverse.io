#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductionStack } from '../ProductionStack';
import { StagingStack } from '../StagingStack';

/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
const deployProps: cdk.StackProps = {
  env: { account: '310849459438', region: 'us-east-1' }
};

import { charmverseCert, scoutgameCert, sunnyCert } from '../config';

const app = new cdk.App();

// Command example: cdk deploy --context name=stg-scoutgame
const stackNameParam: string = app.node.getContext('name');

// Sunny awawrds production
if (stackNameParam === 'prd-sunnyawards') {
  new ProductionStack(app, stackNameParam, deployProps, {
    sslCert: sunnyCert
  });
}
// Scout Game production
else if (
  stackNameParam === 'prd-scoutgame' ||
  stackNameParam === 'prd-waitlist' ||
  stackNameParam === 'prd-comingsoon'
) {
  new ProductionStack(app, stackNameParam, deployProps, {
    sslCert: scoutgameCert
  });
} else if (stackNameParam === 'prd-ceramic') {
  new ProductionStack(app, stackNameParam, deployProps, {
    healthCheck: {
      path: '/graphql',
      port: 5001
    }
  });
} else if (stackNameParam === 'prd-cron') {
  new ProductionStack(app, stackNameParam, deployProps, { environmentType: 'SingleInstance' });
} else if (stackNameParam === 'prd-websockets') {
  new ProductionStack(app, stackNameParam, deployProps, {
    sslCert: charmverseCert,
    environmentType: 'SingleInstance'
  });
}
// Connect webapp and api production
else if (stackNameParam.startsWith('prd')) {
  new ProductionStack(app, stackNameParam, deployProps, {
    sslCert: charmverseCert
  });
} else if (stackNameParam.startsWith('stg-websockets')) {
  new StagingStack(app, stackNameParam, deployProps, {
    healthCheck: { path: '/api/health', port: 3002 },
    environmentType: 'SingleInstance'
  });
} else if (stackNameParam.startsWith('stg-ceramic')) {
  new StagingStack(app, stackNameParam, deployProps, { healthCheck: { path: '/graphql', port: 5001 } });
} else if (stackNameParam.startsWith('stg-cron')) {
  new StagingStack(app, stackNameParam, deployProps, { environmentType: 'SingleInstance' });
} else if (stackNameParam.startsWith('stg-')) {
  new StagingStack(app, stackNameParam, deployProps);
} else {
  throw new Error('Invalid stack name parameter: ' + stackNameParam);
}
