import type { CredentialEventType } from '@charmverse/core/prisma-client';

import type { BaseEvent } from './BaseEvent';

type CredentialEvent = BaseEvent & {
  credentialTemplateId: string;
};

export interface CredentialEventMap {
  credential_issued: CredentialEvent & { trigger: CredentialEventType };
  credential_template_created: CredentialEvent;
  credential_template_deleted: CredentialEvent;
  credential_template_updated: CredentialEvent;
}
