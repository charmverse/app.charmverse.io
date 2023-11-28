import type { TokenGate } from '@charmverse/core/prisma';
import type { LitNodeClient } from '@lit-protocol/lit-node-client';
import type { JsonSigningResourceId, JsonStoreSigningRequest } from '@lit-protocol/types';
import useSWRMutation from 'swr/mutation';

import type { TokenGateConditions } from 'lib/tokenGates/interfaces';

import { usePOST } from './helpers';

export function useCreateTokenGate() {
  return usePOST<
    Partial<
      Omit<TokenGate, 'resourceId' | 'conditions'> & {
        resourceId: JsonSigningResourceId;
        conditions: JsonStoreSigningRequest;
      }
    >,
    TokenGate
  >('/api/token-gates');
}

export function useReviewTokenGate() {
  return usePOST<{ conditions: TokenGateConditions }, { conditions: TokenGateConditions }[]>('/api/token-gates/review');
}

export function useCreateLitToken(litClient: LitNodeClient | null) {
  return useSWRMutation('litClient', (_url: string, { arg }: { arg: JsonStoreSigningRequest }) =>
    litClient?.saveSigningCondition(arg)
  );
}
