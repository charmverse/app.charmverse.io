import type { Space } from '@charmverse/core/prisma';

import * as http from 'adapters/http';
import type { CharmVerseCredentialInput } from 'lib/credentials/attest';
import type { EASAttestationFromApi } from 'lib/credentials/external/getExternalCredentials';
import type {
  CreateCredentialTemplateInput,
  CredentialTemplateUpdate,
  SpaceCredentialEventUpdate
} from 'lib/credentials/templates';

export class CredentialsApi {
  // TODO Test endpoint for generating a credential - remove later
  attest(data: CharmVerseCredentialInput): Promise<EASAttestationFromApi> {
    return http.POST(`/api/credentials`, data);
  }

  createCredentialTemplate(data: CreateCredentialTemplateInput) {
    return http.POST(`/api/credentials/templates`, data);
  }

  updateCredentialTemplate(data: CredentialTemplateUpdate) {
    return http.PUT(`/api/credentials/templates?templateId=${data.templateId}`, data);
  }

  deleteCredentialTemplate(templateId: string) {
    return http.DELETE(`/api/credentials/templates?templateId=${templateId}`);
  }

  updateSpaceCredentialEvents(data: SpaceCredentialEventUpdate) {
    return http.PUT<Space>(`/api/credentials/events`, data);
  }
}
