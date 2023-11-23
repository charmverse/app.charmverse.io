import * as http from 'adapters/http';
import type { CharmVerseCredentialInput } from 'lib/credentials/attest';
import type { CredentialData } from 'lib/credentials/schemas';

export class CredentialsApi {
  attest(data: CharmVerseCredentialInput): Promise<any> {
    return http.POST(`/api/credentials/attest`, data);
  }
}
