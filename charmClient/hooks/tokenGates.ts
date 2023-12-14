import type { TokenGateToRole } from '@charmverse/core/dist/cjs/prisma-client';
import type { LitNodeClient } from '@lit-protocol/lit-node-client';
import type { AuthSig, JsonStoreSigningRequest } from '@lit-protocol/types';
import useSWRMutation from 'swr/mutation';

import type { TokenGateVerificationRequest } from 'lib/tokenGates/applyTokenGates';
import type { TokenGateEvaluationAttempt, TokenGateEvaluationResult } from 'lib/tokenGates/evaluateEligibility';
import type { Lock, TokenGate, LitTokenGateConditions, TokenGateWithRoles } from 'lib/tokenGates/interfaces';
import type { GetLockPayload } from 'lib/tokenGates/unlock/getLockDetails';

import { useDELETE, useGET, useGETtrigger, usePOST, usePUT } from './helpers';

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

export function useReviewTokenGate() {
  return usePOST<{ conditions: LitTokenGateConditions }, { conditions: LitTokenGateConditions }[]>(
    '/api/token-gates/review'
  );
}

export function useSaveSigningCondition(litClient: LitNodeClient | null) {
  return useSWRMutation('litClient', (_url: string, { arg }: { arg: JsonStoreSigningRequest }) =>
    litClient?.saveSigningCondition(arg)
  );
}

export function useReviewLock() {
  return useGETtrigger<GetLockPayload, Lock>('/api/token-gates/unlock-protocol');
}

export function useEvaluateTokenGateEligibility() {
  return usePOST<Omit<TokenGateEvaluationAttempt, 'userId'>, TokenGateEvaluationResult>('/api/token-gates/evaluate');
}

export function useVerifyTokenGate() {
  return usePOST<Omit<TokenGateVerificationRequest, 'userId'>, { error?: string; success?: boolean }>(
    '/api/token-gates/verify'
  );
}

export function useReevaluateRoles() {
  return usePOST<{ authSig: AuthSig; spaceId: string; userId: string }, string[]>('/api/token-gates/reevaluate');
}
