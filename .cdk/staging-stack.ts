import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';

export class CdkDeployStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const webAppZipArchive = new s3assets.Asset(this, 'WebAppZip', {
      path: `${__dirname}/../deploy.zip`,
    });
    // Create a ElasticBeanStalk app. - must be 40 characters or less
    const appName = sanitizeAppName('CharmVerse-staging-' + process.env.STAGE);

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
        value: 'SingleInstance'
      },
      // {
      //   namespace: 'aws:elasticbeanstalk:environment',
      //   optionName: 'EnvironmentType',
      //   value: 'SingleInstance',
      // },
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

    // Create an Elastic Beanstalk environment to run the application
    const ebEnv = new elasticbeanstalk.CfnEnvironment(this, 'Environment', {
      environmentName: appName,
      applicationName: ebApp.applicationName || appName,
      solutionStackName: '64bit Amazon Linux 2 v3.4.13 running Docker',
      optionSettings: optionSettingProperties,
      versionLabel: appVersionProps.ref,
    });

    /**
     * Output the distribution's url so we can pass it to external systems
    *  Note: something at the end of the path is required or the Load balancer url never resolves
     */
     new CfnOutput(this, "DeploymentUrl", {
      value: 'http://' + ebEnv.attrEndpointUrl + '/login',
    });
  }
}

// Member must contain only letters, digits, and the dash character and may not start or end with a dash
function sanitizeAppName (name: string) {
  return name.replace(/[^a-zA-Z0-9-]/g, '').replace(/^-/, '0').replace(/-$/, '0');
}