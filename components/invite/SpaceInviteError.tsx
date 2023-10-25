import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import PrimaryButton from 'components/common/PrimaryButton';

import { CenteredBox } from './components/CenteredBox';

export default function InviteLinkPageError({ reason }: { reason?: 'invalid' | 'banned' | null }) {
  const message =
    reason === 'banned'
      ? "You've been banned from this space."
      : 'This invite may be expired, or you might not have permission to join.';
  return (
    <CenteredBox>
      <Card sx={{ p: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Box display='flex' flexDirection='column' alignItems='center' mb={3}>
          <Typography variant='h5' gutterBottom>
            <strong>Invite Invalid</strong>
          </Typography>
          <Typography align='center' color='danger'>
            {message}
          </Typography>
        </Box>
        <PrimaryButton fullWidth size='large' href='/' external /* external=true avoids space domain being added */>
          Continue to CharmVerse
        </PrimaryButton>
      </Card>
    </CenteredBox>
  );
}
