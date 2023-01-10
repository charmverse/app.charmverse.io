import type { Space } from '@prisma/client';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';

type Props = {
  spaceDomain: string;
  onSuccess: (space: Space) => void;
};

export function useDiscordGate({ spaceDomain, onSuccess }: Props) {
  const { user, refreshUser } = useUser();
  const { showMessage } = useSnackbar();
  const discordUserId = user?.discordUser?.discordId;
  const [joiningSpace, setJoiningSpace] = useState(false);
  const { spaces, setSpaces } = useSpaces();

  const { data } = useSWR(spaceDomain ? `discord/gate/${spaceDomain}/${discordUserId || ''}` : null, () =>
    charmClient.discord.checkDiscordGate(spaceDomain)
  );

  async function verifyDiscordGate() {
    if (!data?.isEligible) {
      showMessage('You are not eligible to join this space', 'error');
      return;
    }

    setJoiningSpace(true);

    try {
      const space = await charmClient.discord.verifyDiscordGate(data.spaceId);

      showMessage(`You have joined the ${space.name} workspace.`, 'success');

      await refreshUser();

      const spaceExists = spaces.some((s) => s.id === space.id);
      if (!spaceExists) {
        setSpaces([...spaces, space as Space]);
      }

      onSuccess(space as Space);
    } catch (err: any) {
      showMessage(err?.message ?? err ?? 'An unknown error occurred', 'error');
    }

    setJoiningSpace(false);
  }

  return {
    isLoading: !!discordUserId && !data,
    discordGate: data,
    isConnectedToDiscord: !!discordUserId,
    verifyDiscordGate,
    joiningSpace
  };
}
