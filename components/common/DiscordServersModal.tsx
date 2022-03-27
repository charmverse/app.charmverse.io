
import { Modal } from 'components/common/Modal';
import { DiscordUserServer } from 'pages/api/discord/servers';
import { Avatar, ListItemAvatar, List, ListItemText, ListItemButton } from '@mui/material';

function DiscordServersModal ({ discordServers, onClose, isOpen }:
  { discordServers: DiscordUserServer[], isOpen: boolean, onClose: () => void }) {

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
    >
      <List sx={{
        maxHeight: 500,
        overflow: 'auto',
        pr: 2
      }}
      >
        {discordServers.sort((discordServerA, discordServerB) => discordServerA.name < discordServerB.name ? -1 : 1)
          .map(discordServer => (
            <ListItemButton>
              <ListItemAvatar>
                <Avatar src={`https://cdn.discordapp.com/icons/${discordServer.id}/${discordServer.icon}.png`}>
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={discordServer.name} />
            </ListItemButton>
          ))}
      </List>
    </Modal>
  );
}

export default DiscordServersModal;
