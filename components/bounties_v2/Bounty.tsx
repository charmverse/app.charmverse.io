import { Bounty as IBounty } from 'models/Bounty';
import { Card, CardHeader, CardContent, Chip } from '@mui/material';
import { useState } from 'react';

export interface IBountyInput {
  bounty: IBounty
}

export function Bounty ({ bounty }: IBountyInput) {

  const [editBounty, toggleBountyDialog] = useState(false);

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: 290,
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
        <Chip variant='outlined' label='Bounty status' color='primary' />
      </CardContent>
    </Card>
  );
}
