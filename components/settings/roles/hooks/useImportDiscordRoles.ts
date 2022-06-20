import { Space } from '@prisma/client';
import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { silentlyUpdateURL } from 'lib/browser';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import useSWRImmutable from 'swr/immutable';
import useRoles from './useRoles';

export function useImportDiscordRoles () {
  const { showMessage } = useSnackbar();
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [space] = useCurrentSpace();
  const {
    refreshRoles
  } = useRoles();

  const shouldRequestServers = isAdmin && space && typeof router.query.guild_id === 'string' && router.query.discord === '1' && router.query.type === 'server';
  const serverConnectFailed = router.query.discord === '2' && router.query.type === 'server';
  const guildId = router.query.guild_id as string;
  // Using immutable version as otherwise its called twice
  const { data, isValidating, error } = useSWRImmutable(shouldRequestServers && space ? 'discord-roles-import' : null, async () => {
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
    silentlyUpdateURL(window.location.href.split('?')[0]);
  }, [data, isValidating, serverConnectFailed]);

  return {
    isValidating
  };
}
