import Link from 'next/link';
import { Box, Card, CardActionArea, CardHeader, Typography } from '@mui/material';
import { Bounty as IBounty } from '@prisma/client';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { fancyTrim } from 'lib/utilities/strings';
import BountyStatusBadge from './BountyStatusBadge';

export interface IBountyInput {
  bounty: IBounty
  truncate?: boolean
}

export function BountyCard ({ truncate = true, bounty }: IBountyInput) {
  const [space] = useCurrentSpace();
  const bountyUrl = `/${space?.domain}/bounties/${bounty.id}`;

  return (
    <Card
      sx={{
        width: 290,
        minHeight: 200,
        height: '100%',
        display: 'grid' // make child full height
      }}
      variant='outlined'
    >
      <Link href={bountyUrl} passHref>
        <CardActionArea
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
      </Link>
    </Card>
  );
}
