
import { Modal } from 'components/common/Modal';
import { DiscordUserServer } from 'pages/api/discord/servers';
import { Avatar, ListItemAvatar, List, ListItemText, ListItemButton, Typography } from '@mui/material';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import charmClient from 'charmClient';
import { useMemo, useState } from 'react';
import { useSnackbar } from 'hooks/useSnackbar';

function DiscordServersModal ({ isFetching, discordServers, onClose, isOpen }:
  { discordServers: DiscordUserServer[], isFetching: boolean, isOpen: boolean, onClose: () => void }) {
  const [currentSpace, setCurrentSpace] = useCurrentSpace();
  const [isConnectingServer, setIsConnectingServer] = useState(false);
  const {
    showMessage
  } = useSnackbar();

  const sortedServers = useMemo(() => discordServers
    .sort((discordServerA, discordServerB) => discordServerA.name < discordServerB.name ? -1 : 1), [discordServers]);
  return currentSpace ? (
    <Modal
      open={isOpen}
      onClose={onClose}
    >
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
                try {
                  setIsConnectingServer(true);
                  await charmClient.connectDiscordServer({
                    guildId: discordServer.id,
                    spaceId: currentSpace.id
                  });
                  setCurrentSpace({
                    ...currentSpace,
                    discordServerId: discordServer.id
                  });
                  showMessage(`Successfully connected to ${discordServer.name}`);
                  onClose();
                }
                catch (_) {
                  showMessage(`Couldn't connect to ${discordServer.name}. Please try again.`, 'error');
                }
                setIsConnectingServer(false);
              }}
            >
              <ListItemAvatar>
                <Avatar src={`https://cdn.discordapp.com/icons/${discordServer.id}/${discordServer.icon}.png`}>
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={discordServer.name} />
            </ListItemButton>
          ))
}
        </List>
      )}
    </Modal>
  ) : null;
}

export default DiscordServersModal;
