import * as http from '@packages/adapters/http';
import type { EnsProfile } from '@packages/profile/getEnsProfile';

export class PublicProfileApi {
  getEnsProfile(userId: string) {
    return http.GET<EnsProfile | null>(`/api/public/profile/${userId}/ens`);
  }
}
