import { CfnOutput, Stack, StackProps, CfnTag } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';


const domain = 'charmverse.co';

export class CdkDeployStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const webAppZipArchive = new s3assets.Asset(this, 'WebAppZip', {
      path: `${__dirname}/../deploy.zip`,
    });
    // Create a ElasticBeanStalk app. - must be 40 characters or less
    const appName = sanitizeAppName('stg-charmverse-' + process.env.STAGE);

    const ebApp = new elasticbeanstalk.CfnApplication(this, 'Application', {
      applicationName: appName,
    });

    // Create an app version from the S3 asset defined earlier
    const appVersionProps = new elasticbeanstalk.CfnApplicationVersion(this, 'AppVersion', {
      applicationName: appName,
      sourceBundle: {
        s3Bucket: webAppZipArchive.s3BucketName,
        s3Key: webAppZipArchive.s3ObjectKey,
      },
    });

    // Make sure that Elastic Beanstalk app exists before creating an app version
    appVersionProps.addDependsOn(ebApp);

    // list of all options: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/command-options-general.html
    const optionSettingProperties: elasticbeanstalk.CfnEnvironment.OptionSettingProperty[] = [
      {
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'IamInstanceProfile',
        value: 'aws-elasticbeanstalk-ec2-role',
      },
      {
        namespace: 'aws:elasticbeanstalk:environment',
        optionName: 'EnvironmentType',
        value: 'LoadBalanced'
      },
      {
        namespace: 'aws:elasticbeanstalk:environment',
        optionName: 'LoadBalancerType',
        value: 'application',
      },
      {
        namespace: 'aws:elbv2:listener:443',
        optionName: 'Protocol',
        value: 'HTTPS',
      },
      {
        namespace: 'aws:elbv2:listener:443',
        optionName: 'ListenerEnabled',
        value: 'true',
      },
      {
        namespace: 'aws:elbv2:listener:443',
        optionName: 'SSLCertificateArns',
        value: 'arn:aws:acm:us-east-1:310849459438:certificate/bfea3120-a440-4667-80fd-d285146f2339',
      },
      {
        // add security group to access
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'SecurityGroups',
        value: 'staging-db-client',
      },
      {
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'EC2KeyName',
        value: 'northshore-webapp',
      },
      {
        namespace: 'aws:autoscaling:asg',
        optionName: 'MaxSize',
        value: '1',
      },
      {
        namespace: 'aws:ec2:instances',
        optionName: 'InstanceTypes',
        value: 't3.micro',
      },
    ];

    const resourceTags: CfnTag[] = [
      { 
        key: 'env',
        value: 'stg'
      } 
    ];

    // Create an Elastic Beanstalk environment to run the application
    const ebEnv = new elasticbeanstalk.CfnEnvironment(this, 'Environment', {
      environmentName: appName,
      applicationName: ebApp.applicationName || appName,
      solutionStackName: '64bit Amazon Linux 2 v3.4.13 running Docker',
      optionSettings: optionSettingProperties,
      tags: resourceTags,
      versionLabel: appVersionProps.ref,
    });

    const zone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domain
    });

    const deploymentDomain = `${process.env.STAGE || ''}.${domain}`;

    new route53.ARecord(this, 'ARecord', {
      zone,
      recordName: deploymentDomain + '.',
      //target: route53.RecordTarget.fromAlias(new targets.ElasticBeanstalkEnvironmentEndpointTarget(ebEnv.attrEndpointUrl)),
      target: route53.RecordTarget.fromAlias({
        bind: (): route53.AliasRecordTargetConfig => ({
          dnsName: ebEnv.attrEndpointUrl,//`${process.env.STACK}.us-east-1.elasticbeanstalk.com`,
          // get hosted zone for elbs based on region: https://docs.aws.amazon.com/general/latest/gr/elb.html
          hostedZoneId: 'Z35SXDOTRQ7X7K'
        })
      }),
    });

    /**
     * Output the distribution's url so we can pass it to external systems
    *  Note: something at the end of the path is required or the Load balancer url never resolves
     */
     new CfnOutput(this, "DeploymentUrl", {
      value: 'https://' + deploymentDomain + '/',
    });
  }
}

// Member must contain only letters, digits, and the dash character and may not start or end with a dash
function sanitizeAppName (name: string) {
  return name.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40).replace(/^-/, '0').replace(/-$/, '0');
}