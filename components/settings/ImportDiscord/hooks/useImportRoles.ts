import charmClient from 'charmClient';
import router from 'next/router';
import { DiscordUserServer } from 'pages/api/discord/listServers';
import { useState, useEffect } from 'react';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

export default function useImportRoles () {
  const { showMessage } = useSnackbar();
  const [isListDiscordServersLoading, setIsListDiscordServersLoading] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [space] = useCurrentSpace();
  const [discordServers, setDiscordServers] = useState<DiscordUserServer[]>([]);
  const [isImportRolesFromServerLoading, setIsImportRolesFromServerLoading] = useState<boolean>(false);
  const [currentSpace] = useCurrentSpace();

  // Are we making a request for listing discord servers of current user
  const isListingDiscordServers = space && typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'server';

  useEffect(() => {
    if (isListingDiscordServers) {
      setIsListDiscordServersLoading(true);
      charmClient.listDiscordServers({
        code: router.query.code as string
      })
        .then(({ servers }) => {
          setDiscordServers(servers);
        })
        .catch((err) => {
          setResponseError(err.error);
        })
        .finally(() => {
          setIsListDiscordServersLoading(false);
        });
    }
  }, [Boolean(space)]);

  async function importRolesFromServer (guildId: string) {
    if (currentSpace) {
      setIsImportRolesFromServerLoading(true);
      charmClient.importRolesFromDiscordServer({
        guildId,
        spaceId: currentSpace.id
      })
        .then(result => {
          showMessage(`Successfully imported ${result.importedRoleCount} discord roles`, 'success');
        }).catch((err: any) => {
          // Major failure while trying to import discord server role
          setResponseError(err.error ?? 'Something went wrong. Please try again');
        }).finally(() => {
          setIsImportRolesFromServerLoading(false);
        });
    }
  }

  return {
    isListDiscordServersLoading,
    isImportRolesFromServerLoading,
    discordServers,
    isListingDiscordServers,
    importRolesFromServer,
    responseError
  };
}
