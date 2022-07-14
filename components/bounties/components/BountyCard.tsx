import Link from 'next/link';
import { Box, Card, CardActionArea, CardHeader, Typography } from '@mui/material';
import { Bounty as IBounty } from '@prisma/client';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { fancyTrim } from 'lib/utilities/strings';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import BountyStatusBadge from './BountyStatusBadge';

/**
 * @publicMode When a bounty card is clicked in public mode, we do not want the user to be directed to the bounty (for now)
 */
export interface IBountyInput {
  bounty: IBounty
  truncate?: boolean
  publicMode?: boolean
}

function BountyCardDetails ({ bounty, truncate }: Pick<IBountyInput, 'bounty' | 'truncate'>) {
  return (
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
  );
}

export function BountyCard ({ truncate = true, bounty, publicMode = false }: IBountyInput) {
  const [space] = useCurrentSpace();
  const bountyUrl = `/${space?.domain}/bounties/${bounty.id}`;
  const router = useRouter();

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
      {/* Temporary solution to prevent navigating to different path */}
      {publicMode ? (
        <BountyCardDetails truncate={truncate} bounty={bounty} />
      ) : (
        <Link href={publicMode ? router.asPath : bountyUrl} passHref={!publicMode}>
          <BountyCardDetails truncate={truncate} bounty={bounty} />
        </Link>
      )}

    </Card>
  );
}
