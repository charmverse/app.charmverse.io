import { useTheme } from '@emotion/react';
import { Box, Card, CardActionArea, CardContent, CardHeader, Chip, Grid, Typography } from '@mui/material';
import { Bounty as IBounty } from '@prisma/client';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { fancyTrim } from 'lib/utilities/strings';
import { BountyStatus } from 'models/Bounty';
import { BrandColor } from 'theme/colors';
import { BountyBadge } from './BountyBadge';

export interface IBountyInput {
  bounty: IBounty
  truncate?: boolean
}

export const BountyStatusColours: Record<BountyStatus, BrandColor> = {
  open: 'gray',
  assigned: 'blue',
  review: 'red',
  complete: 'purple',
  paid: 'green'
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
        <CardHeader subheader={bounty.title} />
        <Box p={2} width='100%' display='flex' flex={1} flexDirection='column' justifyContent='space-between'>
          <Typography paragraph={true}>
            {fancyTrim(bounty.description, 120)}
          </Typography>
          <BountyBadge truncate={truncate} bounty={bounty} hideLink={true} />
        </Box>
      </CardActionArea>
    </Card>
  );
}
