import { SvgIcon, CircularProgress, Alert } from '@mui/material';
import { useRouter } from 'next/router';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { DiscordUserServer } from 'pages/api/discord/listServers';
import { useUser } from 'hooks/useUser';
import { useState, useEffect } from 'react';
import Button from 'components/common/Button';
import DiscordIcon from 'public/images/discord_logo.svg';
import { useSnackbar } from 'hooks/useSnackbar';
import charmClient from 'charmClient';
import DiscordServersModal from './DiscordServersModal';

export default function ImportDiscordRolesButton ({ onUpdate }: { onUpdate: () => void }) {

  const { showMessage } = useSnackbar();
  const [currentSpace] = useCurrentSpace();
  const [user] = useUser();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [discordServers, setDiscordServers] = useState<DiscordUserServer[]>([]);
  const shouldRequestServers = currentSpace && typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'server';

  useEffect(() => {
    if (shouldRequestServers) {
      charmClient.listDiscordServers({
        code: router.query.code as string
      })
        .then(({ servers }) => {
          setDiscordServers(servers);
          setIsModalOpen(true);
        })
        .catch((error: any) => {
          showMessage(error.error ?? 'Something went wrong. Please try again', 'error');
        });
    }
    else {
      setIsModalOpen(false);
    }
  }, [shouldRequestServers]);

  const isCurrentUserAdmin = (user?.spaceRoles
    .find(spaceRole => spaceRole.spaceId === currentSpace?.id)?.role === 'admin');

  async function selectServer (guildId: string) {
    if (!currentSpace) return;
    charmClient.importRolesFromDiscordServer({
      guildId,
      spaceId: currentSpace.id
    })
      .then(result => {
        showMessage(`Successfully imported ${result.importedRoleCount} discord roles`, 'success');
      })
      .catch(error => {
        // Major failure while trying to import discord server role
        showMessage(error.error ?? 'Something went wrong. Please try again', 'error');
      })
      .finally(() => {
        setIsModalOpen(false);
      });
  }

  if (!isCurrentUserAdmin) {
    return null;
  }

  return (
    <>
      <Button
        external
        href={`/api/discord/login?redirect=${encodeURIComponent(window.location.href.split('?')[0])}&type=server`}
        variant='outlined'
        startIcon={(
          <SvgIcon viewBox='0 -10 70 70' sx={{ color: 'text.primary' }}>
            <DiscordIcon />
          </SvgIcon>
          )}
      >
        Import roles
      </Button>
      <DiscordServersModal
        isOpen={isModalOpen}
        discordServers={discordServers}
        onClose={() => {
          setIsModalOpen(false);
        }}
        onSelect={selectServer}
      />
    </>
  );
}
