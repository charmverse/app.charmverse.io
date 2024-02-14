import type { CredentialEventType } from '@charmverse/core/prisma-client';

type CredentialMixpanelEvent = {
  userId: string;
  spaceId: string;
  event: CredentialEventType;
};

export interface CredentialEventMap {
  credential_issued: CredentialMixpanelEvent;
}
