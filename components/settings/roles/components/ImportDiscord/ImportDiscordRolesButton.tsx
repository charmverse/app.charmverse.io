import { SvgIcon } from '@mui/material';
import { useRouter } from 'next/router';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { DiscordUserServer } from 'pages/api/discord/listServers';
import { useUser } from 'hooks/useUser';
import { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Button from 'components/common/Button';
import DiscordIcon from 'public/images/discord_logo.svg';
import { useSnackbar } from 'hooks/useSnackbar';
import charmClient from 'charmClient';
import Link from 'components/common/Link';
import DiscordServersModal from './DiscordServersModal';

export default function ImportDiscordRolesButton ({ onUpdate }: { onUpdate: () => void }) {

  const { showMessage } = useSnackbar();
  const [currentSpace] = useCurrentSpace();
  const [user] = useUser();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // See lib/discord/handleDiscordResponse.ts for the case when we return the error that will be used here
  const [discordErrorFix, setDiscordErrorFix] = useState<{error: string, redirectLink: string} | null>(null);
  const [discordServers, setDiscordServers] = useState<DiscordUserServer[]>([]);
  const shouldRequestServers = currentSpace && typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'server';

  useEffect(() => {

    const serverConnectFailed = router.query.discord === '2' && router.query.type === 'server';

    console.log('Use effect called', serverConnectFailed, router.query);
    if (serverConnectFailed) {
      showMessage('Failed to connect to Discord', 'warning');
    }

  }, [router.query]);

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
    setDiscordErrorFix(null);

    if (!currentSpace) return;
    charmClient.importRolesFromDiscordServer({
      guildId,
      spaceId: currentSpace.id
    })
      .then(result => {
        showMessage(`Successfully imported ${result.importedRoleCount} discord roles`, 'success');
        onUpdate();
      })
      .catch(error => {
        if (error.error && error.redirectLink) {
          setDiscordErrorFix(error);
        }
        else {
        // Major failure while trying to import discord server role
          showMessage(error.error ?? 'Something went wrong. Please try again', 'error');
        }

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
      {
        discordErrorFix && (
          <Alert severity='info'>
            <Link href={discordErrorFix.redirectLink} external target='_blank'>
              {
                discordErrorFix.error
              }
            </Link>
          </Alert>
        )
      }

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
