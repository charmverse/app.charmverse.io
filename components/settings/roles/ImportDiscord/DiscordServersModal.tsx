
import { Modal } from 'components/common/Modal';
import { DiscordUserServer } from 'pages/api/discord/listServers';
import { Avatar, ListItemAvatar, List, ListItemText, ListItemButton, Typography } from '@mui/material';
import { useMemo } from 'react';

function DiscordServersModal (
  {
    isImportRolesFromServerLoading, isListDiscordServersLoading,
    discordServers, onSelect, onClose, isOpen
  }:
    {
      isImportRolesFromServerLoading: boolean, discordServers: DiscordUserServer[], isListDiscordServersLoading: boolean,
      isOpen: boolean, onSelect: (guildId: string) => void, onClose: () => void
    }
) {
  const sortedServers = useMemo(() => discordServers
    .sort((discordServerA, discordServerB) => discordServerA.name < discordServerB.name ? -1 : 1), [discordServers]);
  return (
    <Modal
      open={isOpen}
      title='Select a Discord Server'
      onClose={onClose}
    >
      <Typography variant='subtitle2'>Select a server to start importing roles</Typography>
      {isListDiscordServersLoading ? <Typography variant='h5'>Fetching servers</Typography> : (
        <List sx={{
          maxHeight: 600,
          overflow: 'auto'
        }}
        >
          {
            sortedServers.map(discordServer => (
              <ListItemButton
                key={discordServer.id}
                disabled={isImportRolesFromServerLoading}
                onClick={() => onSelect(discordServer.id)}
              >
                <ListItemAvatar>
                  <Avatar src={discordServer.icon ? `https://cdn.discordapp.com/icons/${discordServer.id}/${discordServer.icon}.png` : undefined} />
                </ListItemAvatar>
                <ListItemText primary={discordServer.name} />
              </ListItemButton>
            ))
          }
        </List>
      )}
    </Modal>
  );
}

export default DiscordServersModal;
