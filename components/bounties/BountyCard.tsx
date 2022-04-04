import { Box, Card, CardActionArea, CardHeader, Typography } from '@mui/material';
import { Bounty as IBounty } from '@prisma/client';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { fancyTrim } from 'lib/utilities/strings';
import { BountyStatus } from 'models/Bounty';
import { BrandColor } from 'theme/colors';
import BountyStatusBadge from './BountyStatusBadge';

export interface IBountyInput {
  bounty: IBounty
  truncate?: boolean
}

export const BountyStatusColours: Record<BountyStatus, BrandColor> = {
  open: 'green',
  assigned: 'yellow',
  review: 'orange',
  complete: 'pink',
  paid: 'gray'
};

export function BountyCard ({ truncate = true, bounty }: IBountyInput) {
  const [space] = useCurrentSpace();
  const bountyUrl = `/${space?.domain}/bounties/${bounty.id}`;

  return (
    <Card
      sx={{
        width: 290,
        m: '5px',
        minHeight: 200,
        cursor: 'pointer'
      }}
      variant='outlined'
    >
      <CardActionArea
        href={bountyUrl}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}
      >
        <CardHeader title={bounty.title} titleTypographyProps={{ sx: { fontSize: '1rem', fontWeight: 'bold' } }} />
        <Box p={2} width='100%' display='flex' flex={1} flexDirection='column' justifyContent='space-between'>
          <Typography paragraph={true}>
            {fancyTrim(bounty.description, 120)}
          </Typography>
          <BountyStatusBadge truncate={truncate} bounty={bounty} />
        </Box>
      </CardActionArea>
    </Card>
  );
}
