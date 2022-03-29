
import { Modal } from 'components/common/Modal';
import { DiscordUserServer } from 'pages/api/discord/listServers';
import { Avatar, ListItemAvatar, List, ListItemText, ListItemButton, Typography } from '@mui/material';
import { useState } from 'react';

interface Props {
  discordServers: DiscordUserServer[]
  isOpen: boolean,
  onSelect: (guildId: string) => void,
  onClose: () => void
}

function DiscordServersModal ({ discordServers, onSelect, onClose, isOpen }: Props) {

  const [isDisabled, setIsDisabled] = useState(false);
  const sortedServers = discordServers
    .sort((discordServerA, discordServerB) => discordServerA.name < discordServerB.name ? -1 : 1);

  function selectServer (guildId: string) {
    setIsDisabled(true);
    onSelect(guildId);
  }

  return (
    <Modal
      open={isOpen}
      title='Import roles from Discord'
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
                onClick={() => selectServer(discordServer.id)}
                disabled={isDisabled}
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
