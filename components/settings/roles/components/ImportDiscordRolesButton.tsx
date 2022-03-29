import { SvgIcon } from '@mui/material';
import { useRouter } from 'next/router';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { useState, useEffect } from 'react';
import Button from 'components/common/Button';
import DiscordIcon from 'public/images/discord_logo.svg';
import { useSnackbar } from 'hooks/useSnackbar';
import charmClient from 'charmClient';

export default function ImportDiscordRolesButton ({ onUpdate }: { onUpdate: () => void }) {

  const { showMessage } = useSnackbar();
  const [currentSpace] = useCurrentSpace();
  const [user] = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isCurrentUserAdmin = (user?.spaceRoles
    .find(spaceRole => spaceRole.spaceId === currentSpace?.id)?.role === 'admin');

  useEffect(() => {
    const shouldRequestServers = isCurrentUserAdmin && currentSpace && typeof router.query.guild_id === 'string' && router.query.discord === '1' && router.query.type === 'server';
    if (shouldRequestServers) {
      importFromServer(router.query.guild_id as string);
    }
    const serverConnectFailed = router.query.discord === '2' && router.query.type === 'server';
    if (serverConnectFailed) {
      showMessage('Failed to connect to Discord', 'warning');
    }
  }, [currentSpace, router.query]);

  function importFromServer (guildId: string) {
    setIsLoading(true);
    return charmClient.importRolesFromDiscordServer({
      guildId,
      spaceId: currentSpace!.id
    })
      .then(result => {
        showMessage(`Successfully imported ${result.importedRoleCount} discord roles`, 'success');
        onUpdate();
      })
      .catch(_error => {
        // Major failure while trying to import discord server role
        showMessage(_error.error ?? 'Something went wrong. Please try again', 'error');
      })
      .finally(() => {
        setIsLoading(false);
        router.push(window.location.href.split('?')[0]);
      });
  }

  if (!isCurrentUserAdmin) {
    return null;
  }

  return (
    <Button
      external
      href={`/api/discord/login?redirect=${encodeURIComponent(window.location.href.split('?')[0])}&type=server`}
      variant='outlined'
      loading={isLoading}
      startIcon={(
        <SvgIcon viewBox='0 -10 70 70' sx={{ color: 'text.primary' }}>
          <DiscordIcon />
        </SvgIcon>
          )}
    >
      Import roles
    </Button>
  );
}
