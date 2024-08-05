import { CfnTag, Stack, StackProps } from 'aws-cdk-lib';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';

export type Options = {
  sslCert: string;
};

export class ProductionStack extends Stack {
  constructor(scope: Construct, appName: string, props: StackProps, options: Options) {
    super(scope, appName, props);

    const webAppZipArchive = new s3assets.Asset(this, 'WebAppZip', {
      path: `${__dirname}/../${appName}.zip`
    });

    const ebApp = new elasticbeanstalk.CfnApplication(this, 'Application', {
      applicationName: appName
    });

    // Create an app version from the S3 asset defined earlier
    const appVersionProps = new elasticbeanstalk.CfnApplicationVersion(this, 'AppVersion', {
      applicationName: appName,
      sourceBundle: {
        s3Bucket: webAppZipArchive.s3BucketName,
        s3Key: webAppZipArchive.s3ObjectKey
      }
    });

    // Make sure that Elastic Beanstalk app exists before creating an app version
    appVersionProps.addDependency(ebApp);

    const healthReportingSystemConfig = {
      Rules: {
        Environment: {
          Application: {
            ApplicationRequests4xx: { Enabled: false }
          },
          ELB: {
            ELBRequests4xx: { Enabled: false }
          }
        }
      },
      Version: 1
    };

    const sslCert = 'arn:aws:acm:us-east-1:310849459438:certificate/4618b240-08da-4d91-98c1-ac12362be229';

    // list of all options: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/command-options-general.html
    const optionSettingProperties: elasticbeanstalk.CfnEnvironment.OptionSettingProperty[] = [
      {
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'IamInstanceProfile',
        value: 'aws-elasticbeanstalk-ec2-role'
      },
      {
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'RootVolumeSize',
        value: '24' // example size in GB
      },
      {
        namespace: 'aws:elasticbeanstalk:environment',
        optionName: 'EnvironmentType',
        value: 'LoadBalanced'
      },
      {
        namespace: 'aws:elasticbeanstalk:environment',
        optionName: 'LoadBalancerType',
        value: 'application'
      },
      {
        namespace: 'aws:elasticbeanstalk:healthreporting:system',
        optionName: 'SystemType',
        value: 'enhanced'
      },
      {
        namespace: 'aws:elasticbeanstalk:healthreporting:system',
        optionName: 'ConfigDocument',
        value: JSON.stringify(healthReportingSystemConfig)
      },
      {
        namespace: 'aws:elbv2:listener:443',
        optionName: 'Protocol',
        value: 'HTTPS'
      },
      {
        namespace: 'aws:elbv2:listener:443',
        optionName: 'ListenerEnabled',
        value: 'true'
      },
      {
        namespace: 'aws:elbv2:listener:443',
        optionName: 'SSLCertificateArns',
        value: options.sslCert
      },
      {
        namespace: 'aws:elbv2:listener:443',
        optionName: 'SSLPolicy',
        value: 'ELBSecurityPolicy-TLS13-1-2-2021-06'
      },
      {
        // add security group to access
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'SecurityGroups',
        value: 'prd-db-client'
      },
      {
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'EC2KeyName',
        value: 'northshore-webapp'
      },
      {
        namespace: 'aws:autoscaling:asg',
        optionName: 'MaxSize',
        value: '3'
      },
      {
        namespace: 'aws:autoscaling:asg',
        optionName: 'Custom Availability Zones',
        value: 'us-east-1a,us-east-1d,us-east-1c,us-east-1f'
      },
      {
        namespace: 'aws:autoscaling:trigger',
        optionName: 'LowerThreshold',
        value: '0' // never hit the lower threshold, so that we dont get chaged for scaling Alarms
      },
      {
        namespace: 'aws:ec2:instances',
        optionName: 'InstanceTypes',
        value: 't3a.small,t3.small'
      },
      {
        // ALB health check
        namespace: 'aws:elasticbeanstalk:application',
        optionName: 'Application Healthcheck URL',
        value: '/api/health'
      }
    ];

    const resourceTags: CfnTag[] = [
      {
        key: 'env',
        value: 'prd'
      }
    ];

    // add ddenabled tag to instance to enable datadog aws integration.
    if (process.env.DDENABLED === 'true') {
      resourceTags.push({
        key: 'ddenabled',
        value: 'true'
      });
    }

    // Create an Elastic Beanstalk environment to run the application
    new elasticbeanstalk.CfnEnvironment(this, 'Environment', {
      environmentName: appName,
      applicationName: ebApp.applicationName || appName,
      solutionStackName: '64bit Amazon Linux 2 v3.5.0 running Docker',
      optionSettings: optionSettingProperties,
      tags: resourceTags,
      versionLabel: appVersionProps.ref
    });
  }
}
