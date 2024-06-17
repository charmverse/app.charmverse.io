
import {BaseCdkDeployStack, DeployStackProps} from './base-staging-stack';

export class DefaultStagingStack extends BaseCdkDeployStack {
  constructor(input: DeployStackProps) {
    super({...input, options: [
      {
        namespace: 'aws:elasticbeanstalk:environment:process:websocket',
        optionName: 'HealthCheckPath',
        value: '/health_check'
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
    ]});
  }
}