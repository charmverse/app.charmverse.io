import { Card, CardActionArea, CardContent, CardHeader, Grid, Tooltip, Typography } from '@mui/material';
import { Bounty as IBounty } from '@prisma/client';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { fancyTrim } from 'lib/utilities/strings';
import { BountyStatus, BOUNTY_LABELS as BountyLabels } from 'models/Bounty';
import { BrandColors } from 'theme/colors';
import { BountyBadge } from './BountyBadge';

export interface IBountyInput {
  bounty: IBounty
}

export const BountyStatusColours: Record<BountyStatus, BrandColors> = {
  open: 'gray',
  assigned: 'blue',
  review: 'red',
  complete: 'purple',
  paid: 'green'
};

const maxBountyTitleCharacters = 40;

export function BountyCard ({ bounty }: IBountyInput) {
  const [space] = useCurrentSpace();
  const bountyUrl = `/${space!.domain}/bounty/${bounty.id}`;

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
      <CardActionArea href={bountyUrl}>

        {
          bounty.title.length > maxBountyTitleCharacters && (
          <Tooltip title={bounty.title} placement='bottom'>
            <CardHeader subheader={fancyTrim(bounty.title, maxBountyTitleCharacters)} />
          </Tooltip>
          )
        }

        {
          bounty.title.length <= maxBountyTitleCharacters && (
          <CardHeader subheader={fancyTrim(bounty.title, maxBountyTitleCharacters)} />
          )
        }

        <CardContent sx={{ flexGrow: 1, display: 'block' }}>

          <Grid container direction='column' justifyContent='space-between'>
            <Grid item xs={12} sx={{ minHeight: '90px' }}>

              <Typography paragraph={true}>
                {fancyTrim(bounty.description, 120)}
              </Typography>

            </Grid>
            <Grid item xs={12}>
              <BountyBadge bounty={bounty} hideLink={true} />
            </Grid>

          </Grid>
        </CardContent>
      </CardActionArea>

    </Card>
  );
}
