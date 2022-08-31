import * as http from 'adapters/http';
import type { CollablandCredential } from 'lib/collabland';

export class CollablandApi {

  getCredentials (aeToken: string) {
    return http.POST<CollablandCredential[]>('/api/collabland/import', { aeToken });
  }
}
