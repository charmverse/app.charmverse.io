import charmClient from 'charmClient';
import router from 'next/router';
import { ImportRolesResponse } from 'pages/api/discord/importRoles';
import { DiscordUserServer } from 'pages/api/discord/listServers';
import { useState, useEffect } from 'react';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

export default function useDiscordImportRoles () {
  const { showMessage } = useSnackbar();
  const [isListDiscordServersLoading, setIsListDiscordServersLoading] = useState(false);
  const [listDiscordServersError, setListDiscordServersError] = useState<string | null>(null);
  const [space] = useCurrentSpace();
  const [discordServers, setDiscordServers] = useState<DiscordUserServer[]>([]);
  const [isImportRolesFromServerLoading, setIsImportRolesFromServerLoading] = useState<boolean>(false);
  const [importRolesFromServerError, setImportRolesFromServerError] = useState<ImportRolesResponse['error'] | null>(null);
  const [currentSpace] = useCurrentSpace();

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
        })
        .catch((err) => {
          setIsListDiscordServersLoading(false);
          setListDiscordServersError(err.error);
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

        // Partial success with some errors
        if (importRolesFromServerResponse.error && importRolesFromServerResponse.error.length !== 0) {
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
