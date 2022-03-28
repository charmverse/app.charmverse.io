import charmClient from 'charmClient';
import router from 'next/router';
import { ImportRolesResponse } from 'pages/api/discord/importRoles';
import { DiscordUserServer } from 'pages/api/discord/servers';
import { useState, useEffect } from 'react';
import { useCurrentSpace } from './useCurrentSpace';
import { useSnackbar } from './useSnackbar';

export default function useDiscordImportRoles () {
  const { showMessage } = useSnackbar();
  const [isListDiscordServersLoading, setIsListDiscordServersLoading] = useState(false);
  const [listDiscordServersError, setListDiscordServersError] = useState<string | null>(null);
  const [space] = useCurrentSpace();
  const [discordServers, setDiscordServers] = useState<DiscordUserServer[]>([]);
  const [isImportRolesFromServerLoading, setIsImportRolesFromServerLoading] = useState<boolean>(false);
  const [importRolesFromServerError, setImportRolesFromServerError] = useState<ImportRolesResponse['error'] | null>(null);
  const [currentSpace, setCurrentSpace] = useCurrentSpace();

  // Are we making a request for listing discord servers of current user
  const isListingDiscordServers = space && typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'server';

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
          setListDiscordServersError(errorMessage);
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
          setImportRolesFromServerError(importRolesFromServerResponse.error);
        }
        else {
          showMessage('Successfully imported discord roles', 'success');
        }
        setIsImportRolesFromServerLoading(false);
      }
      catch (err: any) {
        // Major failure while trying to import discord server role
        setImportRolesFromServerError(err.error ?? err.message ?? 'Something went wrong. Please try again');
      }
    }
  }

  return {
    isListDiscordServersLoading,
    isImportRolesFromServerLoading,
    listDiscordServersError,
    discordServers,
    isListingDiscordServers,
    importRolesFromServer,
    importRolesFromServerError
  };
}
