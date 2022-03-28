import { Button, SvgIcon, CircularProgress, Alert } from '@mui/material';
import { Box } from '@mui/system';
import DiscordServersModal from 'components/settings/ImportDiscord/DiscordServersModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useImportRoles from 'components/settings/ImportDiscord/hooks/useImportRoles';
import { useUser } from 'hooks/useUser';
import { useState, useEffect } from 'react';
import DiscordIcon from 'public/images/discord_logo.svg';

export default function ImportDiscordRolesButton () {
  const [isDiscordServersModalOpen, setIsDiscordServersModalOpen] = useState(false);
  const {
    discordServers,
    isListingDiscordServers,
    responseError,
    importRolesFromServer,
    isListDiscordServersLoading,
    isImportRolesFromServerLoading
  } = useImportRoles();
  const [user] = useUser();
  const [space] = useCurrentSpace();

  useEffect(() => {
    // If we've fetched list of servers
    // If we are listing discord servers
    // If there were no errors while fetching list of servers
    // Show the discord servers modal
    if (!isListDiscordServersLoading && isListingDiscordServers && !responseError) {
      setIsDiscordServersModalOpen(true);
    }
    else {
      setIsDiscordServersModalOpen(false);
    }
  }, [isListDiscordServersLoading, responseError, isListingDiscordServers]);

  const isCurrentUserAdmin = (user?.spaceRoles
    .find(spaceRole => spaceRole.spaceId === space?.id)?.role === 'admin');

  async function selectServer (guildId: string) {
    await importRolesFromServer(guildId);
    setIsDiscordServersModalOpen(false);
  }

  return (
    <>
      <Box
        display='flex'
        gap={1}
        alignItems='center'
      >
        <Button
          disabled={
            (isListDiscordServersLoading && isListingDiscordServers) || !isCurrentUserAdmin || !user?.discordUser
          }
          onClick={() => {
            if (isCurrentUserAdmin) {
              window.location.replace(`/api/discord/login?redirect=${encodeURIComponent(window.location.href.split('?')[0])}&type=server`);
            }
          }}
          variant='outlined'
          startIcon={(
            <SvgIcon viewBox='0 -10 70 70' sx={{ color: 'text.primary' }}>
              <DiscordIcon />
            </SvgIcon>
          )}
          endIcon={(
            isListDiscordServersLoading && <CircularProgress size={20} />
          )}
        >
          Import roles from Discord
        </Button>
      </Box>
      <DiscordServersModal
        isListDiscordServersLoading={isListDiscordServersLoading}
        isOpen={isDiscordServersModalOpen}
        discordServers={discordServers}
        isImportRolesFromServerLoading={isImportRolesFromServerLoading}
        onClose={() => {
          setIsDiscordServersModalOpen(false);
        }}
        onSelect={selectServer}
      />
      {responseError && (
        <Alert severity='error' sx={{ mt: 2 }}>
          {responseError}
        </Alert>
      )}
    </>
  );
}
