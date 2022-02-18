import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import { useBounty } from 'components/bounties/hooks/useBounty';
import styled from '@emotion/styled';

import type { Bounty } from 'models/Bounty';
import { useState } from 'react';
import { Typography } from '@mui/material';

const statusMap = {
  pending: 'Not Started',
  done: 'Done',
  'in-progress': 'In Progress'
};

interface BountyCardProps {
  bounty: Bounty;
}

export default function BountyCard ({ bounty }: BountyCardProps) {
  const [bountyDialogOpen, setBountyDialogOpen] = useState(false);
  const { updateBounty } = useBounty();
  const { id, title, status } = bounty;

  const handleUpdateBounty = (updatingBounty: Bounty) => {
    updateBounty(updatingBounty);
    setBountyDialogOpen(false);
  };

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
        setBountyDialogOpen(true);
      }}
      variant='outlined'
    >
      <CardHeader subheader={title} />
      <CardContent sx={{ flexGrow: 1, display: 'flex', alignItems: 'flex-end' }}>
        <Chip variant='outlined' label='Test' color='primary' />
      </CardContent>
    </Card>
  );
}
