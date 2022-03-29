
import { Modal } from 'components/common/Modal';
import { DiscordUserServer } from 'pages/api/discord/listServers';
import { Avatar, ListItemAvatar, List, ListItemText, ListItemButton, Typography } from '@mui/material';
import { useMemo } from 'react';

interface Props {
  discordServers: DiscordUserServer[]
  isOpen: boolean, onSelect: (guildId: string) => void, onClose: () => void
}

function DiscordServersModal ({ discordServers, onSelect, onClose, isOpen }: Props) {

  const sortedServers = discordServers
    .sort((discordServerA, discordServerB) => discordServerA.name < discordServerB.name ? -1 : 1);

  return (
    <Modal
      open={isOpen}
      title='Select a Discord Server'
      onClose={onClose}
    >
      <Typography variant='subtitle2'>Select a server to start importing roles</Typography>
      <List sx={{
        maxHeight: 600,
        overflow: 'auto'
      }}
      >
        {
            sortedServers.map(discordServer => (
              <ListItemButton
                key={discordServer.id}
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
    </Modal>
  );
}

export default DiscordServersModal;
