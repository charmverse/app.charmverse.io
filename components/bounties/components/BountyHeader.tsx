import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BountyWithDetails } from 'models';
import BountyStatusBadge from './BountyStatusBadge';

interface Props {
  bounty: BountyWithDetails
}

export default function BountyHeader ({ bounty }: Props) {
  return (
    <Box sx={{
      justifyContent: 'space-between',
      gap: 1,
      display: 'flex',
      alignItems: 'center'
    }}
    >
      <Typography fontWeight={500}>Bounty properties</Typography>
      {/* Provide the bounty menu options */}
      <Box display='flex'>
        <BountyStatusBadge
          bounty={bounty}
          truncate
        />
      </Box>
    </Box>
  );
}
