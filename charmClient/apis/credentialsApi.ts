import * as http from 'adapters/http';
import type { CharmVerseCredentialInput } from 'lib/credentials/attest';

export class CredentialsApi {
  attest(data: CharmVerseCredentialInput): Promise<any> {
    return http.POST(`/api/credentials/attest`, data);
  }

  getUserCredentials(data: { account: string }): Promise<any> {
    return http.GET(`/api/credentials/attest`, data);
  }
}
