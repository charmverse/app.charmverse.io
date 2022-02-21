import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { InviteLinkPopulated } from 'lib/invites';

export default function InvitationPage ({ error, invite }: { error?: string, invite?: InviteLinkPopulated }) {

  if (error) {
    return (
      <Box>
        <Typography color='danger'>{error}</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ width: 400, maxWidth: '100%', mx: 'auto' }}>
      <Typography>Welcome!</Typography>
    </Box>
  );
}
