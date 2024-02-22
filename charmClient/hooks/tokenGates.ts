import type { TokenGateToRole } from '@charmverse/core/prisma-client';

import type { AuthSig } from 'lib/blockchain/interfaces';
import type { TokenGateVerificationRequest } from 'lib/tokenGates/applyTokenGates';
import type { TokenGateEvaluationAttempt, TokenGateEvaluationResult } from 'lib/tokenGates/evaluateEligibility';
import type { TokenGate, TokenGateWithRoles, TokenGateConditions } from 'lib/tokenGates/interfaces';

import { useDELETE, useGET, usePOST, usePUT } from './helpers';

export function useGetTokenGates(spaceId: string) {
  return useGET<TokenGateWithRoles[]>(spaceId ? '/api/token-gates' : null, { spaceId });
}

export function useCreateTokenGate() {
  return usePOST<Partial<TokenGate>, void>('/api/token-gates');
}

export function useDeleteTokenGate(id: string) {
  return useDELETE<void>(`/api/token-gates/${id}`);
}

export function useUpdateTokenGateRoles(tokenGateId?: string) {
  return usePUT<{ spaceId: string; roleIds: string[]; tokenGateId: string }, TokenGateToRole[]>(
    `/api/token-gates/${tokenGateId}/roles`
  );
}

export function useReviewTokenGate<T = Pick<TokenGate, 'conditions'>>() {
  return usePOST<T, T>('/api/token-gates/review');
}

export function useEvaluateTokenGateEligibility() {
  return usePOST<TokenGateEvaluationAttempt, TokenGateEvaluationResult>('/api/token-gates/evaluate');
}

export function useVerifyTokenGate() {
  return usePOST<TokenGateVerificationRequest, void>('/api/token-gates/verify');
}

export function useReevaluateRoles() {
  return usePOST<{ authSig: AuthSig; spaceId: string }, string[]>('/api/token-gates/reevaluate');
}
