import type { ElasticLoadBalancingV2ClientConfig } from '@aws-sdk/client-elastic-load-balancing-v2';
import { ElasticLoadBalancingV2 } from '@aws-sdk/client-elastic-load-balancing-v2';
import { getLogger } from '@packages/core/log';
import { getCertificateARNByDomain } from '@packages/lib/aws/ACM';

import { AWS_REGION } from './config';

const log = getLogger('ELB');

const AWS_API_KEY = process.env.AWS_ACCESS_KEY_ID as string;
const AWS_API_SECRET = process.env.AWS_SECRET_ACCESS_KEY as string;
const REGION = (process.env.AWS_REGION as string) || AWS_REGION;

const config: ElasticLoadBalancingV2ClientConfig = { region: REGION, apiVersion: 'latest' };

if (AWS_API_KEY && AWS_API_SECRET) {
  config.credentials = { accessKeyId: AWS_API_KEY, secretAccessKey: AWS_API_SECRET };
}

const elb = new ElasticLoadBalancingV2(config);

export async function getListenerCertificates() {
  const listenerArn = process.env.AWS_ELB_LISTENER_ARN;

  if (!listenerArn) {
    log.warn('No AWS listener ARN found. Skipping certificate check.');
    return;
  }

  const res = await elb.describeListenerCertificates({
    ListenerArn: listenerArn
  });

  return res.Certificates;
}

export async function hasCertificateAdded({ certificateArn, domain }: { certificateArn?: string; domain?: string }) {
  let checkARN = certificateArn;
  if (!checkARN && domain) {
    checkARN = await getCertificateARNByDomain(domain);
  }

  if (!checkARN) {
    log.warn('Could not find certificate ARN', { certificateArn, domain });
    return false;
  }

  const certificates = await getListenerCertificates();

  if (certificates) {
    return certificates.some((cert) => cert.CertificateArn === checkARN);
  }

  return false;
}

export async function addCertificateToListener(certificateArn: string) {
  const listenerArn = process.env.AWS_ELB_LISTENER_ARN;

  if (!listenerArn) {
    log.warn('No AWS listener ARN found. Cannot add certificate.');
    return false;
  }

  const hasCertificate = await hasCertificateAdded({ certificateArn });
  if (hasCertificate) {
    log.info('Certificate already added to listener', { certificateArn });
    return true;
  }

  try {
    await elb.addListenerCertificates({
      ListenerArn: listenerArn,
      Certificates: [{ CertificateArn: certificateArn }]
    });

    return true;
  } catch (err) {
    log.error('Failed to add certificate to listener', { err, certificateArn });
    return false;
  }
}
