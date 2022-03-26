
import { Modal, DialogTitle } from 'components/common/Modal';
import { DiscordUserServer } from 'pages/api/discord/servers';
import { Box } from '@mui/material';

function DiscordServersModal ({ discordServers, onClose, isOpen }:
  { discordServers: DiscordUserServer[], isOpen: boolean, onClose: () => void }) {
  return (
    <Modal open={isOpen} onClose={onClose}>
      {discordServers.map(discordServer => (
        <Box>
          {discordServer.name}
        </Box>
      ))}
    </Modal>
  );
}

export default DiscordServersModal;
