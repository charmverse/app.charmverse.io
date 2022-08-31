import * as http from 'adapters/http';
import type { CredentialsResult } from 'lib/collabland';

export class CollablandApi {

  importCredentials (aeToken: string) {
    return http.POST<CredentialsResult>('/api/collabland/import', { aeToken });
  }
}
