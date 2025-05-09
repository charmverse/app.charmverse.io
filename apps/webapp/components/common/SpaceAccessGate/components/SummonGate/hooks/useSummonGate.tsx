import type { Space } from '@charmverse/core/prisma-client';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import type { VerificationResponse } from '@packages/lib/summon/verifyMembership';
import type { TokenGateJoinType } from '@packages/lib/tokenGates/interfaces';

type Props = {
  joinType?: TokenGateJoinType;
  space: Space;
  onSuccess: () => void;
};

export type SummonGateState = {
  isEnabled: boolean;
  isVerifying: boolean;
  isVerified: boolean;
  verifyResult?: VerificationResponse;
  joinSpace: (onError: (error: any) => void) => void;
  joiningSpace: boolean;
};

export function useSummonGate({ joinType = 'token_gate', space, onSuccess }: Props): SummonGateState {
  const { user, refreshUser } = useUser();
  const { showMessage } = useSnackbar();
  const [joiningSpace, setJoiningSpace] = useState(false);
  const { spaces, setSpaces } = useSpaces();

  const { data, isLoading: isVerifying } = useSWR(
    space.xpsEngineId ? `discord/gate/${space.id}/${user?.id}` : null,
    () => charmClient.summon.verifyMembership({ spaceId: space.id })
  );

  async function joinSpace(onError: (error: any) => void) {
    setJoiningSpace(true);

    try {
      await charmClient.summon.joinVerifiedSpace({ joinType, spaceId: space.id });

      showMessage(`You have joined the ${space.name} space.`, 'success');

      await refreshUser();

      const spaceExists = spaces.some((s) => s.id === space.id);
      if (!spaceExists) {
        setSpaces([...spaces, space]);
      }

      onSuccess();
    } catch (err: any) {
      onError(err);
    }

    setJoiningSpace(false);
  }

  return {
    isVerifying,
    isEnabled: !!space.xpsEngineId,
    verifyResult: data,
    isVerified: !!data?.isVerified,
    joinSpace,
    joiningSpace
  };
}
