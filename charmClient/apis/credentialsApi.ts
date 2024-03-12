import * as http from 'adapters/http';
import type { CharmVerseCredentialInput } from 'lib/credentials/attestOffchain';
import type { EASAttestationFromApi } from 'lib/credentials/external/getOnchainCredentials';
import type { CreateCredentialTemplateInput, CredentialTemplateUpdate } from 'lib/credentials/templates';

export class CredentialsApi {
  // TODO Test endpoint for generating a credential - remove later
  attest(data: CharmVerseCredentialInput): Promise<EASAttestationFromApi> {
    return http.POST(`/api/credentials`, data);
  }

  createCredentialTemplate(data: CreateCredentialTemplateInput) {
    return http.POST(`/api/credentials/templates`, data);
  }

  updateCredentialTemplate({ fields, templateId }: CredentialTemplateUpdate) {
    return http.PUT(`/api/credentials/templates?templateId=${templateId}`, fields);
  }

  deleteCredentialTemplate(templateId: string) {
    return http.DELETE(`/api/credentials/templates?templateId=${templateId}`);
  }
}
