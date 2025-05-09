import * as http from '@packages/adapters/http';

import type { VerificationResponse } from '@packages/lib/summon/verifyMembership';
import type { TokenGateJoinType } from '@packages/lib/tokenGates/interfaces';

export class SummonApi {
  async joinVerifiedSpace(input: { spaceId: string; joinType: TokenGateJoinType }) {
    return http.POST('/api/summon/join-space', input);
  }

  async verifyMembership(input: { spaceId: string }) {
    return http.GET<VerificationResponse>('/api/summon/verify-membership', input);
  }

  async syncSpaceRoles(input: { spaceId: string }) {
    return http.GET<{ totalSpaceRolesAdded: number; totalSpaceRolesUpdated: number }>('/api/summon/sync-roles', input);
  }
}
