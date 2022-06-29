import { Space } from '@prisma/client';
import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { silentlyUpdateURL } from 'lib/browser';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import useSWRImmutable from 'swr/immutable';
import useRoles from 'hooks/useRoles';

function routerQueryIsDiscordCallback () {
  const urlSearchParams = new URLSearchParams(window.location.href);
  return {
    shouldImportDiscordRoles: typeof urlSearchParams.get('guild_id') === 'string' && urlSearchParams.get('discord') === '1' && urlSearchParams.get('type') === 'server',
    serverConnectFailed: urlSearchParams.get('discord') === '2' && urlSearchParams.get('type') === 'server'
  };
}

export function useImportDiscordRoles () {
  const { showMessage } = useSnackbar();
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [space] = useCurrentSpace();
  const {
    refreshRoles
  } = useRoles();

  const { serverConnectFailed, shouldImportDiscordRoles } = routerQueryIsDiscordCallback();
  const guildId = router.query.guild_id as string;
  // Using immutable version as otherwise its called twice
  const { data, isValidating, error } = useSWRImmutable(isAdmin && shouldImportDiscordRoles && space ? 'discord-roles-import' : null, async () => {
    return charmClient.importRolesFromDiscordServer({
      guildId,
      spaceId: (space as Space).id
    });
  });

  useEffect(() => {
    if (data && !isValidating) {
      showMessage(`Successfully imported ${data.importedRoleCount} discord roles`, 'success');
      refreshRoles();
    }
    else if (error) {
      // Major failure while trying to import discord server role
      showMessage(error.message || error.error || 'Something went wrong. Please try again', 'error');
    }
    else if (serverConnectFailed) {
      showMessage('Failed to connect to Discord', 'warning');
    }
    // Remove the query string from the url as they are no longer needed after discord import
    const urlWithoutQueryString = window.location.href.split('?')[0];
    silentlyUpdateURL(urlWithoutQueryString);
  }, [data, isValidating, serverConnectFailed]);

  return {
    isValidating
  };
}
