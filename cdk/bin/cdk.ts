#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecretsRoleStack } from '../lib/secrets-role-stack';

const app = new cdk.App();

new SecretsRoleStack(app, 'SecretsRoleStack', {
  env: {
    account: process.env.AWS_ACCOUNT_ID,   // your AWS account id
    region: process.env.AWS_REGION || 'ap-southeast-2'
  }
});
