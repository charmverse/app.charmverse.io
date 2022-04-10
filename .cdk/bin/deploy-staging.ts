#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkDeployStack } from '../ebs-staging-stack';

const app = new cdk.App();

new CdkDeployStack(app, 'CdkDeployStack', {

  env: { account: '310849459438' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});