import { Bounty as IBounty, BountyStatus, BOUNTY_LABELS as BountyLabels } from 'models/Bounty';
import { Card, CardHeader, CardContent, Chip, Typography, Grid } from '@mui/material';
import { useState } from 'react';

export interface IBountyInput {
  bounty: IBounty
}

const BountyStatusColours: Record<BountyStatus, string> = {
  open: 'blue',
  assigned: 'red',
  review: 'purple',
  complete: 'green'
};

export function Bounty ({ bounty }: IBountyInput) {

  const [editBounty, toggleBountyDialog] = useState(false);

  return (
    <Card
      sx={{
        display: 'inline-block',
        flexDirection: 'column',
        width: 290,
        m: '5px',
        minHeight: 200,
        cursor: 'pointer'
      }}
      onClick={() => {
        toggleBountyDialog(true);
      }}
      variant='outlined'
    >
      <CardHeader subheader={bounty.title} />
      <CardContent sx={{ flexGrow: 1, display: 'flex', alignItems: 'flex-end' }}>
        <Grid container>
          <Grid item xs={12}>
            <Typography paragraph={true}>
              {bounty.description.substring(0, 120)}
              ..
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Chip variant='outlined' label={BountyLabels[bounty.status]} />
          </Grid>
        </Grid>

      </CardContent>
    </Card>
  );
}
