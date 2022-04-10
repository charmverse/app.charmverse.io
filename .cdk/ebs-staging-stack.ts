import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';

export class CdkDeployStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const webAppZipArchive = new s3assets.Asset(this, 'WebAppZip', {
      path: `${__dirname}/../deploy.zip`,
    });
    // Create a ElasticBeanStalk app.
    const appName = 'CharmVerse-ephemeral';

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

    // Create role and instance profile
    // const myRole = new iam.Role(this, `${appName}-aws-elasticbeanstalk-ec2-role`, {
    //   assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    // });

    // const managedPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWebTier')
    // myRole.addManagedPolicy(managedPolicy);

    // const myProfileName = `${appName}-InstanceProfile`

    // const instanceProfile = new iam.CfnInstanceProfile(this, myProfileName, {
    //   instanceProfileName: myProfileName,
    //   roles: [
    //     myRole.roleName
    //   ]
    // });
    // const certificate = new certificatemanager.Certificate(this, 'Certificate', {
    //   // domainName: props.domainName,
    //   // subjectAlternativeNames: [],
    //   // validationMethod: certificatemanager.ValidationMethod.EMAIL,
    // });

    // list of all options: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/command-options-general.html
    const optionSettingProperties: elasticbeanstalk.CfnEnvironment.OptionSettingProperty[] = [
      {
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'IamInstanceProfile',
        value: 'aws-elasticbeanstalk-ec2-role',
      },
      {
        namespace: 'aws:elasticbeanstalk:environment',
        optionName: 'LoadBalancerType',
        value: 'application'
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
        value: 't2.micro',
      },
    ];

    // Create an Elastic Beanstalk environment to run the application
    const ebEnv = new elasticbeanstalk.CfnEnvironment(this, 'Environment', {
      environmentName: appName + '-Environment',
      applicationName: ebApp.applicationName || appName,
      solutionStackName: '64bit Amazon Linux 2 v3.4.13 running Docker',
      optionSettings: optionSettingProperties,
      versionLabel: appVersionProps.ref,
    });
    //ebEnv.addDependsOn(ebApp);

    /**
     * Output the distribution's url so we can pass it to external systems
     */
     new CfnOutput(this, "DeploymentUrl", {
      value: "http://" + ebEnv.getMetadata('EnvironmentURL'),
    });

    console.log('Visit your environment: http://' + ebEnv.getMetadata('EnvironmentURL'));
  }
}
