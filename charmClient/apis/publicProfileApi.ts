import type { ProfileFragment } from '@lens-protocol/client';

import * as http from 'adapters/http';
import type { EnsProfile } from 'lib/profile/getEnsProfile';

export class PublicProfileApi {
  getLensProfile(userId: string) {
    return http.GET<ProfileFragment | null>(`/api/public/profile/${userId}/lens`);
  }

  getEnsProfile(userId: string) {
    return http.GET<EnsProfile | null>(`/api/public/profile/${userId}/ens`);
  }
}
