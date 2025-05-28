import type { Space } from '@charmverse/core/prisma-client';
import type { TokenGateEvaluationResult } from '@packages/lib/tokenGates/evaluateEligibility';
import type { TokenGateJoinType, TokenGateWithRoles } from '@packages/lib/tokenGates/interfaces';
import { useEffect, useState } from 'react';

import { useEvaluateTokenGateEligibility, useGetTokenGates, useVerifyTokenGate } from 'charmClient/hooks/tokenGates';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';

type Props = {
  account?: string | null;
  autoVerify?: boolean;
  joinType?: TokenGateJoinType;
  space: Space;
  onSuccess?: () => void;
};

export type TokenGateState = {
  isEnabled: boolean;
  tokenGates: TokenGateWithRoles[] | null;
  tokenGateResult?: TokenGateEvaluationResult;
  isVerified: boolean;
  isVerifying: boolean;
  evaluateEligibility: () => Promise<void>;
  joinSpace: (onError: (error: any) => void) => Promise<void>;
  joiningSpace: boolean;
};

export function useTokenGates({
  account,
  autoVerify = false,
  space,
  joinType = 'token_gate',
  onSuccess
}: Props): TokenGateState {
  const { showMessage } = useSnackbar();
  const { spaces, setSpaces } = useSpaces();
  const { refreshUser, user } = useUser();
  const { trigger: verifyTokenGateAndJoin } = useVerifyTokenGate();

  const [joiningSpace, setJoiningSpace] = useState(false);
  const { data: tokenGates = null } = useGetTokenGates(space.id);
  const {
    data: tokenGateResult,
    trigger: evaluateSpaceTokenGates,
    isMutating: isVerifying
  } = useEvaluateTokenGateEligibility();

  useEffect(() => {
    if (autoVerify && account && user?.wallets?.length) {
      evaluateEligibility();
    }
  }, [user?.wallets.length, account, autoVerify]);

  async function evaluateEligibility() {
    await evaluateSpaceTokenGates(
      { spaceIdOrDomain: space.id },
      {
        onError: (err: any) => {
          showMessage(err?.message ?? 'An unknown error occurred', err?.severity ?? 'error');
        }
      }
    );
  }

  async function joinSpace(onError: (error: any) => void) {
    setJoiningSpace(true);

    try {
      await verifyTokenGateAndJoin({
        commit: true,
        spaceId: space.id,
        tokenGateIds: tokenGateResult?.eligibleGates ?? [],
        joinType
      });

      showMessage(`You have joined the ${space.name} space.`, 'success');

      await refreshUser();

      const spaceExists = spaces.some((s) => s.id === space.id);

      // Refresh spaces as otherwise the redirect will not work
      if (!spaceExists) {
        setSpaces([...spaces, space]);
      }
      onSuccess?.();
    } catch (err: any) {
      onError(err);
    }
    setJoiningSpace(false);
  }

  return {
    isEnabled: !!tokenGates && tokenGates.length > 0,
    joinSpace,
    tokenGates,
    isVerifying,
    isVerified: !!tokenGateResult?.canJoinSpace,
    evaluateEligibility,
    tokenGateResult,
    joiningSpace
  };
}
