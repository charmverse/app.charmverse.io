import type { ACMClientConfig } from '@aws-sdk/client-acm';
import { ACM } from '@aws-sdk/client-acm';
import { getLogger } from '@charmverse/core/log';
import type { DomainCertificateDetails } from '@packages/lib/aws/interfaces';
import { isValidDomainName } from '@packages/lib/utils/domains/isValidDomainName';

import { AWS_REGION } from './config';

const log = getLogger('ACM');

const AWS_API_KEY = process.env.AWS_ACCESS_KEY_ID as string;
const AWS_API_SECRET = process.env.AWS_SECRET_ACCESS_KEY as string;
const REGION = (process.env.AWS_REGION as string) || AWS_REGION;

const config: ACMClientConfig = { region: REGION, apiVersion: 'latest' };

if (AWS_API_KEY && AWS_API_SECRET) {
  config.credentials = { accessKeyId: AWS_API_KEY, secretAccessKey: AWS_API_SECRET };
}

const acm = new ACM(config);

const MAX_RETRIES = 3;

export async function getCertificateARNByDomain(domainName: string) {
  const res = await acm.listCertificates({
    CertificateStatuses: ['ISSUED', 'PENDING_VALIDATION']
  });

  return res.CertificateSummaryList?.find((cert) => cert.DomainName === domainName)?.CertificateArn;
}

export async function requestCertificateForDomain(domainName: string) {
  if (!isValidDomainName(domainName)) {
    log.warn(`Tried to reuiqest ACM certificate for invalid domain name: ${domainName}`);
    return;
  }

  const existingCertARN = await getCertificateARNByDomain(domainName);

  if (existingCertARN) {
    return existingCertARN;
  }

  const res = await acm.requestCertificate({
    DomainName: domainName,
    ValidationMethod: 'DNS'
  });

  return res.CertificateArn;
}

export async function getCertificateDetails({
  domainName,
  createCertificate,
  certificateArn,
  retry = 0
}: {
  domainName?: string;
  certificateArn?: string;
  retry?: number;
  createCertificate?: boolean;
}): Promise<DomainCertificateDetails | undefined> {
  let certArn = certificateArn || (await getCertificateARNByDomain(domainName || ''));
  if (!certArn && createCertificate && domainName) {
    certArn = await requestCertificateForDomain(domainName);
  }

  if (!certArn) {
    log.warn(`Could not load certificate for domain: ${domainName}`);
    return;
  }

  const { Certificate: cert } = await acm.describeCertificate({
    CertificateArn: certArn
  });

  if (!cert) {
    log.warn('Failed to load certificate', { certArn, domainName });
    return;
  }

  const validation = cert.DomainValidationOptions?.[0];

  if (!validation?.ResourceRecord?.Value && cert.Status === 'PENDING_VALIDATION' && retry < MAX_RETRIES) {
    log.info('Waiting for certificate to be validated', { certArn, domainName });
    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });

    return getCertificateDetails({ certificateArn: certArn, createCertificate, retry: retry + 1 });
  }

  const details: DomainCertificateDetails = {
    domain: cert.DomainName || '',
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
