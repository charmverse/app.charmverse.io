import { StagingStack } from './StagingStack';
import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class WebappStagingStack extends StagingStack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props, {
      options: [
        {
          namespace: 'aws:elasticbeanstalk:environment:process:websocket',
          optionName: 'HealthCheckPath',
          value: '/api/health'
        },
        {
          namespace: 'aws:elasticbeanstalk:environment:process:websocket',
          optionName: 'Port',
          value: '3002'
        },
        {
          namespace: 'aws:elasticbeanstalk:environment:process:websocket',
          optionName: 'Protocol',
          value: 'HTTP'
        },
        {
          namespace: 'aws:elbv2:listener:3002',
          optionName: 'ListenerEnabled',
          value: 'true'
        },
        {
          namespace: 'aws:elbv2:listener:3002',
          optionName: 'Protocol',
          value: 'HTTPS'
        },
        {
          namespace: 'aws:elbv2:listener:3002',
          optionName: 'SSLCertificateArns',
          value: 'arn:aws:acm:us-east-1:310849459438:certificate/bfea3120-a440-4667-80fd-d285146f2339'
        },
        {
          namespace: 'aws:elbv2:listener:3002',
          optionName: 'DefaultProcess',
          value: 'websocket'
        }
      ]
    });
  }
}
