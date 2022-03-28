import { Button, SvgIcon, CircularProgress } from '@mui/material';
import { Box } from '@mui/system';
import DiscordServersModal from 'components/common/DiscordServersModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useDiscordServers from 'hooks/useDiscordServers';
import { useUser } from 'hooks/useUser';
import { useState, useEffect } from 'react';
import DiscordIcon from 'public/images/discord_logo.svg';

export default function ImportDiscordRoles () {
  const [isDiscordServersModalOpen, setIsDiscordServersModalOpen] = useState(false);
  const {
    discordServers,
    isListingDiscordServers,
    discordError,
    importRolesFromServer,
    isListDiscordServersLoading
  } = useDiscordServers();
  const [user] = useUser();
  const [space] = useCurrentSpace();

  useEffect(() => {
    if (!isListDiscordServersLoading && isListingDiscordServers && !discordError) {
      setIsDiscordServersModalOpen(true);
    }
    else {
      setIsDiscordServersModalOpen(false);
    }
  }, [isListDiscordServersLoading, discordError, isListingDiscordServers]);

  const isCurrentUserAdmin = (user?.spaceRoles
    .find(spaceRole => spaceRole.spaceId === space?.id)?.role === 'admin');

  return (
    <>
      <Box
        display='flex'
        gap={1}
        alignItems='center'
      >
        <Button
          disabled={(isListDiscordServersLoading && isListingDiscordServers) || !isCurrentUserAdmin}
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
          Import Roles
        </Button>
      </Box>
      <DiscordServersModal
        isFetching={isListDiscordServersLoading}
        isOpen={isDiscordServersModalOpen}
        discordServers={discordServers}
        onClose={() => {
          setIsDiscordServersModalOpen(false);
        }}
        onImportingDiscordRoles={(guildId) => importRolesFromServer(guildId)}
      />
    </>
  );
}
