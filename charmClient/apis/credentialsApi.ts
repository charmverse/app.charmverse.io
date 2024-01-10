import * as http from 'adapters/http';
import type { CharmVerseCredentialInput } from 'lib/credentials/attest';
import type { PublishedSignedCredential } from 'lib/credentials/config/queriesAndMutations';

export class CredentialsApi {
  attest(data: CharmVerseCredentialInput): Promise<PublishedSignedCredential> {
    return http.POST(`/api/credentials`, data);
  }

  getUserCredentials(data: { account: string }): Promise<PublishedSignedCredential[]> {
    return http.GET<PublishedSignedCredential[]>(`/api/credentials`, data);
  }

  createCredentialTemplate() {
    return http.POST(`/api/credentials`, data);
  }

  getTemplates() {
    return http.GET<PublishedSignedCredential[]>(`/api/credentials`, data);
  }
}
