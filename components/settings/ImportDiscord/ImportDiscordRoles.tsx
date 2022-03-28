import { Button, SvgIcon, CircularProgress, Alert } from '@mui/material';
import { Box } from '@mui/system';
import DiscordServersModal from 'components/settings/ImportDiscord/DiscordServersModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useDiscordImportRoles from 'components/settings/ImportDiscord/hooks/useDiscordImportRoles';
import { useUser } from 'hooks/useUser';
import { useState, useEffect } from 'react';
import DiscordIcon from 'public/images/discord_logo.svg';

export default function ImportDiscordRoles () {
  const [isDiscordServersModalOpen, setIsDiscordServersModalOpen] = useState(false);
  const {
    discordServers,
    isListingDiscordServers,
    listDiscordServersError,
    importRolesFromServer,
    isListDiscordServersLoading,
    isImportRolesFromServerLoading,
    importRolesFromServerError
  } = useDiscordImportRoles();
  const [user] = useUser();
  const [space] = useCurrentSpace();

  useEffect(() => {
    // If we've fetched list of servers
    // If we are listing discord servers
    // If there were no errors while fetching list of servers
    // Show the discord servers modal
    if (!isListDiscordServersLoading && isListingDiscordServers && !listDiscordServersError) {
      setIsDiscordServersModalOpen(true);
    }
    else {
      setIsDiscordServersModalOpen(false);
    }
  }, [isListDiscordServersLoading, listDiscordServersError, isListingDiscordServers]);

  const isCurrentUserAdmin = (user?.spaceRoles
    .find(spaceRole => spaceRole.spaceId === space?.id)?.role === 'admin');

  return (
    <div>
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
        onImportingDiscordRoles={(guildId) => importRolesFromServer(guildId)}
      />
      {importRolesFromServerError && (typeof importRolesFromServerError !== 'string' ? importRolesFromServerError?.length !== 0 && (
        <Alert severity='error' sx={{ mt: 2 }}>
          <Box sx={{
            display: 'flex', gap: 2, flexDirection: 'column'
          }}
          >
            Error faced during import:
            {importRolesFromServerError?.map(failedImport => (
              <div>
                <Box sx={{
                  display: 'flex',
                  gap: 1
                }}
                >
                  <span>{failedImport.action === 'assign' ? `Failed to assign ${failedImport.roles.join(',')} to user ${failedImport.username}` : `Failed to create role ${failedImport.role}`}</span>
                </Box>
              </div>
            ))}
          </Box>
        </Alert>
      ) : (
        <Alert severity='error' sx={{ mt: 2 }}>
          {importRolesFromServerError}
        </Alert>
      ))}
    </div>
  );
}
