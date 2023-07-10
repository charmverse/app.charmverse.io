import type { ACMClientConfig } from '@aws-sdk/client-acm';
import { ACM } from '@aws-sdk/client-acm';
import { log } from '@charmverse/core/log';

import type { DomainCertificateDetails } from 'lib/aws/interfaces';
import { isValidDomainName } from 'lib/utilities/domains/isValidDomainName';

import { AWS_REGION } from './config';

const AWS_API_KEY = process.env.AWS_ACCESS_KEY_ID as string;
const AWS_API_SECRET = process.env.AWS_SECRET_ACCESS_KEY as string;
const REGION = (process.env.AWS_REGION as string) || AWS_REGION;

const config: ACMClientConfig = { region: REGION, apiVersion: 'latest' };

if (AWS_API_KEY && AWS_API_SECRET) {
  config.credentials = { accessKeyId: AWS_API_KEY, secretAccessKey: AWS_API_SECRET };
}

const acm = new ACM(config);

const MAX_RETRIES = 3;

export async function requestCertificateForDomain(domainName: string) {
  if (!isValidDomainName(domainName)) {
    log.warn(`Tried to reuiqest ACM certificate for invalid domain name: ${domainName}`);
    return;
  }

  const res = await acm.requestCertificate({
    DomainName: domainName,
    ValidationMethod: 'DNS'
  });

  return res.CertificateArn;
}

export async function getCertificateDetailsForDomain(domainName: string, retry = 0) {
  const certARN = await requestCertificateForDomain(domainName);

  if (!certARN) {
    log.warn(`Could not load certificate for domain: ${domainName}`);
    return;
  }

  const { Certificate: cert } = await acm.describeCertificate({
    CertificateArn: certARN
  });

  if (!cert) {
    log.warn('Failed to load certificate', { certARN, domainName });
    return;
  }

  const validation = cert.DomainValidationOptions?.[0];

  if (!validation?.ResourceRecord?.Value && retry <= MAX_RETRIES) {
    log.info('Waiting for certificate to be validated', { certARN, domainName });
    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });

    return getCertificateDetailsForDomain(domainName, retry + 1);
  }

  const details: DomainCertificateDetails = {
    domain: domainName,
    dnsValidation: {
      status: validation?.ValidationStatus || '',
      name: validation?.ResourceRecord?.Name || '',
      value: validation?.ResourceRecord?.Value || '',
      type: validation?.ResourceRecord?.Type || ''
    },
    status: cert.Status || ''
  };

  return details;
}
