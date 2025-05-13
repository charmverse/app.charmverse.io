import type { Space } from '@charmverse/core/prisma';
import type { DomainCertificateDetails } from '@packages/lib/aws/interfaces';

// This type is unused for now. We are returning the full space document to the user.
// This should either be deleted, or picked up again in the future.
// If we use it, we will need to update the space-related hooks so they also use this subset. This way, we can guarantee consistent behaviour between logged-in and public mode.
export type PublicSpaceInfo = Pick<Space, 'domain' | 'id'>;

export type CustomDomainVerification = {
  isRedirectVerified: boolean;
  isCertificateVerified: boolean;
  isCertificateAttached: boolean;
  isCustomDomainVerified: boolean;
  certificateDetails: DomainCertificateDetails | null;
};
