import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import type { SpaceWithGates } from 'lib/spaces/interfaces';

type Props = {
  space: SpaceWithGates;
  onSuccess: () => void;
};

export function useSummonGate({ space, onSuccess }: Props) {
  const { user, refreshUser } = useUser();
  const { showMessage } = useSnackbar();
  const [joiningSpace, setJoiningSpace] = useState(false);
  const { spaces, setSpaces } = useSpaces();

  const { data, isLoading } = useSWR(space.xpsEngineId ? `discord/gate/${space.id}/${user?.id}` : null, () =>
    charmClient.summon.verifyMembership({ spaceId: space.id })
  );

  async function joinSpace() {
    if (!data?.isVerified) {
      showMessage('You are not eligible to join this space', 'error');
      return;
    }

    setJoiningSpace(true);

    try {
      await charmClient.summon.joinVerifiedSpace({ spaceId: space.id });

      showMessage(`You have joined the ${space.name} space.`, 'success');

      await refreshUser();

      const spaceExists = spaces.some((s) => s.id === space.id);
      if (!spaceExists) {
        setSpaces([...spaces, space]);
      }

      onSuccess();
    } catch (err: any) {
      showMessage(err?.message ?? err ?? 'An unknown error occurred', 'error');
    }

    setJoiningSpace(false);
  }

  return {
    isLoading,
    isSummonEnabled: !!space.xpsEngineId,
    isVerified: data?.isVerified,
    joinSpace,
    joiningSpace
  };
}
