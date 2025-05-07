import type { DocusignCredential } from '@charmverse/core/prisma-client';

// Docusign requires us to wait 15 minutes between requests to their API
export const docusignPeriodBetweenRequestsInSeconds = 60 * 16; // 15 minutes

export type RequiredDocusignCredentials = Pick<
  DocusignCredential,
  'docusignAccountId' | 'docusignApiBaseUrl' | 'accessToken'
>;
