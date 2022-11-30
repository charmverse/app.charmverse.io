import useSWR from 'swr';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';

type Props = {
  spaceDomain: string;
};

export function useDiscordGate({ spaceDomain }: Props) {
  const { user } = useUser();
  const discordUserId = user?.discordUser?.discordId;

  const { data } = useSWR(`discord/gate/${spaceDomain}/${discordUserId || ''}`, () =>
    charmClient.discord.checkDiscordGate(spaceDomain)
  );

  return { isLoading: !data, discordGate: data, isConnectedToDiscord: !!discordUserId };
}
