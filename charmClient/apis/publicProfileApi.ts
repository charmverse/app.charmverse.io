import type { ProfileFragment } from '@lens-protocol/client';

import * as http from 'adapters/http';
import type { EnsProfile } from 'lib/profile/getEnsProfile';
import type { Game7Inventory } from 'lib/profile/getGame7Profile';

export class PublicProfileApi {
  getLensProfile(userId: string) {
    return http.GET<ProfileFragment | null>(`/api/public/profile/${userId}/lens`);
  }

  getEnsProfile(userId: string) {
    return http.GET<EnsProfile | null>(`/api/public/profile/${userId}/ens`);
  }

  getGame7Profile(userId: string) {
    return http.GET<Game7Inventory | null>(`/api/public/profile/${userId}/game7`);
  }
}
