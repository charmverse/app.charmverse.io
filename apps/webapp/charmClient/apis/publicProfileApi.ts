import * as http from '@packages/adapters/http';
import type { SummonUserProfile } from '@packages/lib/summon/interfaces';
import type { EnsProfile } from '@packages/profile/getEnsProfile';

export class PublicProfileApi {
  getEnsProfile(userId: string) {
    return http.GET<EnsProfile | null>(`/api/public/profile/${userId}/ens`);
  }

  getSummonProfile(userId: string, spaceId: string) {
    return http.GET<SummonUserProfile | null>(`/api/public/profile/${userId}/summon`, { spaceId });
  }
}
