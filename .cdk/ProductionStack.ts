import { CfnTag, Stack, StackProps } from 'aws-cdk-lib';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';

export type Options = {
  healthCheck?: { port: number; path: string };
  sslCert?: string;
  environmentTier?: 'WebServer' | 'Worker';
  environmentType?: 'SingleInstance' | 'LoadBalanced';
  instanceType?: string;
};

export const defaultHealthCheck = { path: '/api/health', port: 80 };

export class ProductionStack extends Stack {
  constructor(
    scope: Construct,
    appName: string,
    props: StackProps,
    {
      sslCert,
      healthCheck = defaultHealthCheck,
      environmentTier = 'WebServer',
      environmentType = 'LoadBalanced',
      instanceType = 't3a.small,t3.small'
    }: Options
  ) {
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
      /* Begin graceful deployment settings */
      {
        namespace: 'aws:elasticbeanstalk:command',
        optionName: 'DeploymentPolicy',
        value: 'Rolling'
      },
      {
        namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
        optionName: 'RollingUpdateEnabled',
        value: 'true'
      },
      {
        namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
        optionName: 'RollingUpdateType',
        value: 'Health'
      },
      {
        namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
        optionName: 'MinInstancesInService',
        value: '1'
      },
      {
        namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
        optionName: 'MaxBatchSize',
        value: '3'
      },
      /* End graceful deployment settings */
      {
        namespace: 'aws:elasticbeanstalk:environment',
        optionName: 'EnvironmentType',
        value: environmentType
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
      ...(sslCert
        ? [
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
              value: sslCert
            },
            {
              namespace: 'aws:elbv2:listener:443',
              optionName: 'SSLPolicy',
              value: 'ELBSecurityPolicy-TLS13-1-2-2021-06'
            }
          ]
        : []),
      {
        // add security group to access
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'SecurityGroups',
        value: 'default, prd-db-client'
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
        value: '0' // never hit the lower threshold, so that we dont get charged for scaling Alarms
      },
      {
        namespace: 'aws:ec2:instances',
        optionName: 'InstanceTypes',
        value: instanceType
      },
      {
        namespace: 'aws:elasticbeanstalk:environment:process:default',
        optionName: 'HealthCheckPath',
        value: healthCheck.path
      },
      {
        namespace: 'aws:elasticbeanstalk:environment:process:default',
        optionName: 'MatcherHTTPCode',
        value: '200'
      },
      {
        namespace: 'aws:elasticbeanstalk:environment:process:default',
        optionName: 'Port',
        value: healthCheck.port?.toString() || '80'
      },
      {
        // ALB health check
        namespace: 'aws:elasticbeanstalk:application',
        optionName: 'Application Healthcheck URL',
        value: healthCheck.path
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
      versionLabel: appVersionProps.ref,
      tier:
        environmentTier === 'Worker'
          ? {
              name: environmentTier,
              type: environmentTier === 'Worker' ? 'SQS/HTTP' : 'Standard'
            }
          : undefined
    });
  }
}
