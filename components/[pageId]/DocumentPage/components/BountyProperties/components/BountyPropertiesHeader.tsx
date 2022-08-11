import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BountyWithDetails } from 'models';
import BountyStatusBadge from 'components/bounties/components/BountyStatusBadge';

interface Props {
  bounty: BountyWithDetails
}

export default function BountyPropertiesHeader ({ bounty }: Props) {
  return (
    <Box sx={{
      justifyContent: 'space-between',
      gap: 1,
      display: 'flex',
      alignItems: 'center'
    }}
    >
      <Typography fontWeight='bold'>Bounty information</Typography>
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
