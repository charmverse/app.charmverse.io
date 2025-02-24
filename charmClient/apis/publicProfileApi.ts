import type { ProfileFragment } from '@lens-protocol/client';
import type { EnsProfile } from '@packages/profile/getEnsProfile';
import * as http from '@root/adapters/http';

import type { SummonUserProfile } from 'lib/summon/interfaces';

export class PublicProfileApi {
  getEnsProfile(userId: string) {
    return http.GET<EnsProfile | null>(`/api/public/profile/${userId}/ens`);
  }

  getSummonProfile(userId: string, spaceId: string) {
    return http.GET<SummonUserProfile | null>(`/api/public/profile/${userId}/summon`, { spaceId });
  }

  getLensProfile(userId: string) {
    return http.GET<ProfileFragment>(`/api/public/profile/${userId}/lens`);
  }
}
