import { Box, Card, CardActionArea, CardHeader, Typography } from '@mui/material';
import Link from 'components/common/Link';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { fancyTrim } from 'lib/utilities/strings';
import { BountyWithDetails } from 'models';
import BountyStatusBadge from './BountyStatusBadge';

/**
 * @publicMode When a bounty card is clicked in public mode, we do not want the user to be directed to the bounty (for now)
 */
export interface IBountyInput {
  bounty: BountyWithDetails
  truncate?: boolean
  publicMode?: boolean
}

function BountyCardDetails ({ bounty, truncate }: Pick<IBountyInput, 'bounty' | 'truncate'>) {
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
      <CardActionArea
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}
      >
        <CardHeader title={bounty.page?.title} titleTypographyProps={{ sx: { fontSize: '1rem', fontWeight: 'bold' } }} />
        <Box p={2} width='100%' display='flex' flex={1} flexDirection='column' justifyContent='space-between'>
          <Typography paragraph={true}>
            {fancyTrim(bounty.page.contentText, 120)}
          </Typography>
          <BountyStatusBadge truncate={truncate} bounty={bounty} />
        </Box>
      </CardActionArea>
    </Card>
  );
}

export function BountyCard ({ truncate = true, bounty, publicMode = false }: IBountyInput) {
  const [space] = useCurrentSpace();
  const bountyUrl = `/${space?.domain}/bounties/${bounty.id}`;

  return (publicMode ? (
    <BountyCardDetails truncate={truncate} bounty={bounty} />
  ) : (
    <Link href={bountyUrl}>
      <BountyCardDetails truncate={truncate} bounty={bounty} />
    </Link>
  )
  );
}
