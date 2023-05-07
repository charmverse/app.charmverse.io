import type { TokenGate } from '@charmverse/core/prisma';
import type { JsonAuthSig, JsonSigningResourceId } from '@lit-protocol/types';
import type { TokenGate } from '@prisma/client';

import * as http from 'adapters/http';
import type {
  TokenGateEvaluationAttempt,
  TokenGateEvaluationResult,
  TokenGateVerification,
  TokenGateWithRoles
} from 'lib/token-gates/interfaces';

export class TokenGatesApi {
  // Token Gates
  getTokenGates(query: { spaceId: string }) {
    return http.GET<TokenGateWithRoles[]>('/api/token-gates', query);
  }

  getTokenGatesForSpace(query: { spaceDomain: string }) {
    return http.GET<TokenGateWithRoles[]>('/api/token-gates', query);
  }

  saveTokenGate(
    tokenGate: Partial<Omit<TokenGate, 'resourceId'> & { resourceId: JsonSigningResourceId }>
  ): Promise<TokenGate> {
    return http.POST<TokenGate>('/api/token-gates', tokenGate);
  }

  deleteTokenGate(id: string) {
    return http.DELETE<TokenGate>(`/api/token-gates/${id}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verifyTokenGate(verification: Omit<TokenGateVerification, 'userId'>): Promise<{ error?: string; success?: boolean }> {
    return http.POST('/api/token-gates/verify', verification);
  }

  evalueTokenGateEligibility(
    verification: Omit<TokenGateEvaluationAttempt, 'userId'>
  ): Promise<TokenGateEvaluationResult> {
    return http.POST('/api/token-gates/evaluate', verification);
  }

  reevaluateRoles(verification: { authSig: JsonAuthSig; spaceId: string; userId: string }): Promise<string[]> {
    return http.POST('/api/token-gates/reevaluate', verification);
  }
}
