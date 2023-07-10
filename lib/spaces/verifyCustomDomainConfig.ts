import { prisma } from '@charmverse/core/prisma-client';

import { getCertificateDetails, requestCertificateForDomain } from 'lib/aws/ACM';
import { addCertificateToListener, hasCertificateAdded } from 'lib/aws/ELB';
import type { CustomDomainVerification } from 'lib/spaces/interfaces';

export async function verifyCustomDomainConfig(spaceId: string): Promise<CustomDomainVerification | null> {
  const space = await prisma.space.findUnique({ where: { id: spaceId } });

  if (!space || !space.customDomain) {
    return null;
  }
  const domain = space.customDomain;
  const certificateArn = await requestCertificateForDomain(domain);
  const certDetails = await getCertificateDetails({ certificateArn });

  let hasCertificateInELB = await hasCertificateAdded({ certificateArn });
  if (certDetails?.status === 'ISSUED' && !hasCertificateInELB && certificateArn) {
    hasCertificateInELB = await addCertificateToListener(certificateArn);
  }

  const isRedirectVerified = await isRedirectConfigured(domain);
  const isCertificateVerified = certDetails?.status === 'ISSUED';
  const isCertificateAttached = hasCertificateInELB;

  const isCustomDomainVerified = isRedirectVerified && isCertificateVerified && isCertificateAttached;

  // if (isCustomDomainVerified && !space.isCustomDomainVerified) {
  //   await prisma.space.update({
  //     where: { id: spaceId },
  //     data: { isCustomDomainVerified: true }
  //   });
  // }

  return {
    isRedirectVerified,
    isCertificateVerified,
    isCertificateAttached,
    isCustomDomainVerified,
    certificateDetails: certDetails || null
  };
}

// Verify if domain DNS redirect has been configured by calling our health api
async function isRedirectConfigured(domain: string) {
  try {
    await fetch(`https://${domain}/api/health`);
    return true;
  } catch (e) {
    return false;
  }
}
