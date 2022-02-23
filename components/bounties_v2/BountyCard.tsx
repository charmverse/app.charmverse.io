import { Card, CardHeader, CardContent, Chip, Typography, Grid, CardActionArea } from '@mui/material';
import { Bounty as IBounty } from '@prisma/client';
import Button from '@mui/material/Button';
import BountyModal from 'components/bounties_v2/BountyModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useState } from 'react';
import { BrandColors } from 'theme/colors';
import { fancyTrim } from 'lib/strings';
import { BountyStatus, BOUNTY_LABELS as BountyLabels } from 'models/Bounty';

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

export function BountyCard ({ bounty }: IBountyInput) {

  const [editBounty, setDisplayBountyDialog] = useState(false);
  const [space] = useCurrentSpace();

  const bountyColor = BountyStatusColours[bounty.status];
  const bountyLabel = BountyLabels[bounty.status];

  function closeDialog () {
    setDisplayBountyDialog(false);
  }

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
        <CardHeader subheader={bounty.title} />
      </CardActionArea>
      <CardContent sx={{ flexGrow: 1, display: 'block' }}>

        <Grid container direction='column' justifyContent='space-between'>
          <Grid item xs={12} sx={{ minHeight: '90px' }}>

            <Typography paragraph={true}>
              {fancyTrim(bounty.description, 120)}
            </Typography>

          </Grid>
          <Grid item xs={12}>
            <Chip variant='filled' label={bountyLabel} color={bountyColor as any} />
          </Grid>

        </Grid>
      </CardContent>

    </Card>
  );
}
