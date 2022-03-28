import charmClient from 'charmClient';
import router from 'next/router';
import { DiscordUserServer } from 'pages/api/discord/servers';
import { useState, useEffect } from 'react';
import { useCurrentSpace } from './useCurrentSpace';
import { useSnackbar } from './useSnackbar';

export default function useDiscordServers () {
  const [discordError, setDiscordError] = useState<string | null>(null);
  const { showMessage } = useSnackbar();
  const [isListDiscordServersLoading, setIsListDiscordServersLoading] = useState(false);
  const [space] = useCurrentSpace();
  const [discordServers, setDiscordServers] = useState<DiscordUserServer[]>([]);
  const isListingDiscordServers = space && typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'server';
  const [isImportRolesFromServerLoading, setIsImportRolesFromServerLoading] = useState<boolean>(false);
  const [currentSpace, setCurrentSpace] = useCurrentSpace();

  useEffect(() => {
    if (isListingDiscordServers) {
      setIsListDiscordServersLoading(true);
      charmClient.listDiscordServers({
        code: router.query.code as string,
        spaceId: space.id
      })
        .then(({ servers }) => {
          setIsListDiscordServersLoading(false);
          setDiscordServers(servers);
          showMessage('Successfully fetched servers');
        })
        .catch((err) => {
          setIsListDiscordServersLoading(false);
          const errorMessage = err.message ?? err.error ?? 'Something went wrong. Please try again';
          showMessage(errorMessage, 'error');
          setDiscordError(errorMessage);
        });
    }
  }, [Boolean(space)]);

  async function importRolesFromServer (guildId: string) {
    if (currentSpace) {
      try {
        setIsImportRolesFromServerLoading(true);
        const importRolesFromServerResponse = await charmClient.importRolesFromServer({
          guildId,
          spaceId: currentSpace.id
        });

        // If the import was successful the workspace has been connected with the discord server
        setCurrentSpace({
          ...currentSpace,
          discordServerId: guildId
        });

        // Partial success with some errors
        if (importRolesFromServerResponse.error && importRolesFromServerResponse.error.length !== 0) {
          showMessage('Imported discord roles with errors. Check alert for more information', 'info');
        }
        else {
          showMessage('Successfully imported discord roles', 'success');
        }
        setIsImportRolesFromServerLoading(false);
      }
      catch (err: any) {
        // Major failure while trying to import discord server role
        showMessage(err.message, 'error');
      }
    }
  }

  return {
    isListDiscordServersLoading,
    isImportRolesFromServerLoading,
    discordError,
    discordServers,
    isListingDiscordServers,
    importRolesFromServer
  };
}
