import type { Space } from '@charmverse/core/prisma';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useRoles } from 'hooks/useRoles';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSnackbar } from 'hooks/useSnackbar';
import { setUrlWithoutRerender } from 'lib/utils/browser';

export function useImportDiscordRoles() {
  const { showMessage } = useSnackbar();
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const { space } = useCurrentSpace();
  const { refreshRoles } = useRoles();
  const { openSettings } = useSettingsDialog();

  const [importDiscordRoles, setImportDiscordRoles] = useState(false);

  const guildId = router.query.guild_id as string;
  // Using immutable version as otherwise its called twice
  const { data, isValidating, error } = useSWRImmutable(
    importDiscordRoles ? 'discord-roles-import' : null,
    async () => {
      openSettings(`roles`);
      return charmClient.discord
        .importRolesFromDiscordServer({
          guildId,
          spaceId: (space as Space).id
        })
        .then((_data) => {
          setImportDiscordRoles(false);
          showMessage(`Successfully imported ${_data.importedRoleCount} discord roles`, 'success');
          refreshRoles();
          setTimeout(() => {
            setUrlWithoutRerender(router.asPath, { guild_id: null, discord: null, type: null });
          }, 0);
          return _data;
        })
        .catch((err) => {
          showMessage(err.message || err.error || 'Something went wrong. Please try again', 'error');
          setTimeout(() => {
            setUrlWithoutRerender(router.pathname, { guild_id: null, discord: null, type: null });
          }, 0);
          return null;
        });
    }
  );

  useEffect(() => {
    if (
      isAdmin &&
      space &&
      !isValidating &&
      typeof router.query.guild_id === 'string' &&
      !!router.query.guild_id &&
      router.query.type === 'import-roles'
    ) {
      setImportDiscordRoles(true);
    }
  }, [router.query, space]);

  const serverConnectFailed = router.query.discord === '2' && router.query.type === 'server';

  useEffect(() => {
    if (error) {
      // Major failure while trying to import discord server role
    } else if (serverConnectFailed) {
      showMessage('Failed to connect to Discord', 'warning');
    }
  }, [data, isValidating, serverConnectFailed]);

  return {
    isValidating
  };
}
