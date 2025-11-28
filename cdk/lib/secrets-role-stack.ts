import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class SecretsRoleStack extends Stack {
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create role
    this.role = new iam.Role(this, 'PlaywrightLocalRole', {
      assumedBy: new iam.AccountRootPrincipal(), // for local user assume, can change to specific IAM user
      roleName: 'PlaywrightLocalRole'
    });

    // Attach policy to read secrets
    this.role.addToPolicy(new iam.PolicyStatement({
      actions: [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      resources: ["*"], // or restrict to specific secret ARN
    }));
  }
}