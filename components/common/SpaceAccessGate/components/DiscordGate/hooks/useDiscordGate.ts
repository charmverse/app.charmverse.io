import type { Space } from '@prisma/client';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import type { CheckDiscordGateResult } from 'lib/discord/interface';
import type { TokenGateJoinType } from 'lib/token-gates/interfaces';

type Props = {
  joinType?: TokenGateJoinType;
  spaceDomain: string;
  onSuccess: () => void;
};

export type DiscordGateState = {
  isEnabled: boolean;
  isVerifying: boolean;
  isVerified: boolean;
  isConnectedToDiscord: boolean;
  discordGate?: CheckDiscordGateResult;
  joinSpace: () => Promise<void>;
  joiningSpace: boolean;
};

export function useDiscordGate({ joinType, spaceDomain, onSuccess }: Props): DiscordGateState {
  const { user, refreshUser } = useUser();
  const { showMessage } = useSnackbar();
  const discordUserId = user?.discordUser?.discordId;
  const [joiningSpace, setJoiningSpace] = useState(false);
  const { spaces, setSpaces } = useSpaces();

  const { data } = useSWR(spaceDomain ? `discord/gate/${spaceDomain}/${discordUserId || ''}` : null, () =>
    charmClient.discord.checkDiscordGate(spaceDomain)
  );

  async function joinSpace() {
    setJoiningSpace(true);

    try {
      const space = await charmClient.discord.verifyDiscordGate({ spaceId: data!.spaceId, joinType });

      showMessage(`You have joined the ${space.name} space.`, 'success');

      await refreshUser();

      const spaceExists = spaces.some((s) => s.id === space.id);
      if (!spaceExists) {
        setSpaces([...spaces, space as Space]);
      }

      onSuccess();
    } catch (err: any) {
      showMessage(err?.message ?? err ?? 'An unknown error occurred', 'error');
    }

    setJoiningSpace(false);
  }

  return {
    isEnabled: !!data?.hasDiscordServer,
    isVerifying: !!discordUserId && !data,
    isVerified: !!data?.isVerified,
    discordGate: data,
    isConnectedToDiscord: !!discordUserId,
    joinSpace,
    joiningSpace
  };
}
