import * as http from 'adapters/http';
import type { CollablandCredential } from 'lib/collabland';

export class CollablandApi {

  getCollablandCredentials (aeToken: string) {
    return http.POST<CollablandCredential[]>('/api/collabland/saveCredentials', { aeToken });
  }
}
