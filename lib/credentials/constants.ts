import type { CredentialEventType } from '@charmverse/core/prisma-client';

export const credentialLabelMap: Record<CredentialEventType, string> = {
  proposal_created: 'Published proposal',
  proposal_approved: 'Proposal approved'
};
