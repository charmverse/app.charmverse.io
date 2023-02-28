import * as http from 'adapters/http';
import type { VerificationResponse } from 'lib/summon/verifyMembership';
import type { TokenGateJoinType } from 'lib/token-gates/interfaces';

export class SummonApi {
  async joinVerifiedSpace(input: { spaceId: string; joinType: TokenGateJoinType }) {
    return http.POST('/api/summon/join-space', input);
  }

  async verifyMembership(input: { spaceId: string }) {
    return http.GET<VerificationResponse>('/api/summon/verify-membership', input);
  }
}
