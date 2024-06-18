
import {BaseCdkDeployStack, DeployStackProps} from './base-staging-stack';

export class ConnectAppStagingStack extends BaseCdkDeployStack {
  constructor(input: DeployStackProps) {
    super({...input, options: [
      {
        namespace: 'aws:elasticbeanstalk:environment:process:connectapi',
        optionName: 'HealthCheckPath',
        value: '/health-check'
      },
      {
        namespace: 'aws:elasticbeanstalk:environment:process:connectapi',
        optionName: 'Port',
        value: '4000'
      },
      {
        namespace: 'aws:elasticbeanstalk:environment:process:connectapi',
        optionName: 'Protocol',
        value: 'HTTP'
      },
      {
        namespace: 'aws:elbv2:listener:4000',
        optionName: 'ListenerEnabled',
        value: 'true'
      },
      {
        namespace: 'aws:elbv2:listener:4000',
        optionName: 'Protocol',
        value: 'HTTPS'
      },
      {
        namespace: 'aws:elbv2:listener:4000',
        optionName: 'SSLCertificateArns',
        value: 'arn:aws:acm:us-east-1:310849459438:certificate/bfea3120-a440-4667-80fd-d285146f2339'
      },
      {
        namespace: 'aws:elbv2:listener:4000',
        optionName: 'DefaultProcess',
        value: 'connectapi'
      },
    ]});
  }
}