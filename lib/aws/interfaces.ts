import type { CertificateStatus, DomainStatus } from '@aws-sdk/client-acm';

export type DomainCertificateDetails = {
  domain: string;
  dnsValidation: {
    status: string;
    name: string;
    type: string;
    value: DomainStatus | string;
  };
  status: CertificateStatus | string;
};
