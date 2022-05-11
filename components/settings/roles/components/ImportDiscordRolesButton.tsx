import { SvgIcon } from '@mui/material';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useRouter } from 'next/router';
import DiscordIcon from 'public/images/discord_logo.svg';
import { useEffect, useState } from 'react';

export default function ImportDiscordRolesButton () {

  const { showMessage } = useSnackbar();
  const [currentSpace] = useCurrentSpace();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = useIsAdmin();

  useEffect(() => {
    const shouldRequestServers = isAdmin && currentSpace && typeof router.query.guild_id === 'string' && router.query.discord === '1' && router.query.type === 'server';
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
        router.replace(window.location.href.split('?')[0], undefined, { shallow: true });
      })
      .catch(_error => {
        // Major failure while trying to import discord server role
        showMessage(_error.message || _error.error || 'Something went wrong. Please try again', 'error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Button
      external
      href={`/api/discord/oauth?redirect=${encodeURIComponent(window.location.href.split('?')[0])}&type=server`}
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
