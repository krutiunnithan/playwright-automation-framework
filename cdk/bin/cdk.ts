import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { SecretsRoleStack } from '../lib/secrets-role-stack';

const app = new cdk.App();

new SecretsRoleStack(app, 'SecretsRoleStack', {
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION || 'ap-southeast-2'
  }
});