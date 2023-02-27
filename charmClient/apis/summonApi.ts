import * as http from 'adapters/http';
import type { VerificationResponse } from 'lib/summon/verifyMembership';

export class SummonApi {
  async joinVerifiedSpace(input: { spaceId: string }) {
    return http.POST('/api/summon/join-space', input);
  }

  async verifyMembership(input: { spaceId: string }) {
    return http.GET<VerificationResponse>('/api/summon/verify-membership', input);
  }
}
