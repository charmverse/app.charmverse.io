import charmClient from 'charmClient';
import router from 'next/router';
import { DiscordUserServer } from 'pages/api/discord/servers';
import { useState, useEffect } from 'react';
import { useCurrentSpace } from './useCurrentSpace';
import { useSnackbar } from './useSnackbar';

export default function useDiscordServers () {
  const [discordError, setDiscordError] = useState<string | null>(null);
  const { showMessage } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [space] = useCurrentSpace();
  const [discordServers, setDiscordServers] = useState<DiscordUserServer[]>([]);
  const isListingDiscordServers = space && typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'server';
  useEffect(() => {
    if (isListingDiscordServers) {
      setIsLoading(true);
      charmClient.listDiscordServers({
        code: router.query.code as string,
        spaceId: space.id
      })
        .then(({ servers }) => {
          setIsLoading(false);
          setDiscordServers(servers);
          showMessage('Successfully fetched servers');
        })
        .catch((err) => {
          setIsLoading(false);
          const errorMessage = err.message ?? err.error ?? 'Something went wrong. Please try again';
          showMessage(errorMessage, 'error');
          setDiscordError(errorMessage);
        });
    }
  }, [Boolean(space)]);

  return {
    isLoading,
    discordError,
    discordServers,
    isListingDiscordServers
  };
}
