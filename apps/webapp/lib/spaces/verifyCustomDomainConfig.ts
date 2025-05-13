import dns from 'dns/promises';

import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCertificateDetails, requestCertificateForDomain } from '@packages/lib/aws/ACM';
import { addCertificateToListener, hasCertificateAdded } from '@packages/lib/aws/ELB';
import type { CustomDomainVerification } from 'lib/spaces/interfaces';
import { request, Agent } from 'undici';

const log = getLogger('ELB');

export async function verifyCustomDomainConfig(spaceId: string): Promise<CustomDomainVerification> {
  const space = await prisma.space.findUnique({ where: { id: spaceId } });

  if (!space || !space.customDomain) {
    return {
      isRedirectVerified: false,
      isCertificateVerified: false,
      isCertificateAttached: false,
      isCustomDomainVerified: false,
      certificateDetails: null
    };
  }

  const domain = space.customDomain;
  const certificateArn = await requestCertificateForDomain(domain);
  const certDetails = await getCertificateDetails({ certificateArn });

  let hasCertificateInELB = false;
  try {
    hasCertificateInELB = await hasCertificateAdded({ certificateArn });

    if (certDetails?.status === 'ISSUED' && !hasCertificateInELB && certificateArn) {
      hasCertificateInELB = await addCertificateToListener(certificateArn);
    }
  } catch (e) {
    log.warn('Could not check if certificate is added to ELB', { certificateArn, domain, e });
    hasCertificateInELB = true;
  }

  const isRedirectVerified = await isRedirectConfigured(domain, space.domain);
  const isCertificateVerified = certDetails?.status === 'ISSUED';
  const isCertificateAttached = hasCertificateInELB;

  const isCustomDomainVerified = isRedirectVerified && isCertificateVerified && isCertificateAttached;

  if (isCustomDomainVerified !== space.isCustomDomainVerified) {
    await prisma.space.update({
      where: { id: spaceId },
      data: { isCustomDomainVerified: true }
    });
  }

  return {
    isRedirectVerified,
    isCertificateVerified,
    isCertificateAttached,
    isCustomDomainVerified,
    certificateDetails: certDetails || null
  };
}

// Verify if domain DNS redirect has been configured by calling our health api
async function isRedirectConfigured(domain: string, spaceDomain: string) {
  const isDnsConfigured = await isDnsRedirectConfigured(domain, spaceDomain);
  if (isDnsConfigured) {
    return true;
  }

  try {
    await request(`https://${domain}/api/health`, {
      dispatcher: new Agent({ connect: { rejectUnauthorized: false } })
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function isDnsRedirectConfigured(domain: string, spaceDomain: string) {
  try {
    const addresses = await dns.resolveCname(domain);
    const appDomain = 'charmverse.io';

    return addresses.includes(`${spaceDomain}.${appDomain}`);
  } catch (e) {
    return false;
  }
}
