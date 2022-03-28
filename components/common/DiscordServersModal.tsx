
import { Modal } from 'components/common/Modal';
import { DiscordUserServer } from 'pages/api/discord/servers';
import { Avatar, ListItemAvatar, List, ListItemText, ListItemButton, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

function DiscordServersModal ({ isFetching, discordServers, onImportingDiscordRoles, onClose, isOpen }:
  {
    discordServers: DiscordUserServer[], isFetching: boolean, isOpen: boolean,
    onImportingDiscordRoles: (guildId: string) => Promise<void>, onClose: () => void
  }) {
  const [isConnectingServer, setIsConnectingServer] = useState(false);

  const sortedServers = useMemo(() => discordServers
    .sort((discordServerA, discordServerB) => discordServerA.name < discordServerB.name ? -1 : 1), [discordServers]);
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
    >
      <Typography
        variant='h6'
        sx={{
          textTransform: 'uppercase'
        }}
        mb={1}
      >
        Your Servers
        <Typography variant='subtitle2'>Click on any of them to start importing roles</Typography>
      </Typography>
      {isFetching ? <Typography variant='h5'>Fetching servers</Typography> : (
        <List sx={{
          maxHeight: 500,
          overflow: 'auto',
          pr: 2
        }}
        >
          {
            sortedServers.map(discordServer => (
              <ListItemButton
                key={discordServer.id}
                disabled={isConnectingServer}
                onClick={async () => {
                  await onImportingDiscordRoles(discordServer.id);
                  setIsConnectingServer(false);
                }}
              >
                <ListItemAvatar>
                  <Avatar src={`https://cdn.discordapp.com/icons/${discordServer.id}/${discordServer.icon}.png`} />
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
