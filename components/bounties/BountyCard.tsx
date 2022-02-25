import { useTheme } from '@emotion/react';
import { Card, CardActionArea, CardContent, CardHeader, Chip, Grid, Typography } from '@mui/material';
import { Bounty as IBounty } from '@prisma/client';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { fancyTrim } from 'lib/utilities/strings';
import { BountyStatus, BOUNTY_LABELS as BountyLabels } from 'models/Bounty';
import { useState } from 'react';
import { BrandColors } from 'theme/colors';

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
  const theme = useTheme();
  const [editBounty, setDisplayBountyDialog] = useState(false);
  const [space] = useCurrentSpace();

  const bountyColor = theme.palette[BountyStatusColours[bounty.status]].main;
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
      </CardActionArea>

    </Card>
  );
}
