import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import BountyModal from 'components/bounties/BountyModal';
import { useBounty } from 'components/bounties/hooks/useBounty';
import styled from '@emotion/styled';

import type { TBountyCard } from 'models/Bounty';
import { useState } from 'react';

// xtungvo TODO: apply theme changes
const StyledTitled = styled.div`
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  font-weight: bold;
  font-size: 20px;
  line-height: 23px;
  color: ${({ theme }) => theme.palette.secondary.main};
  flex-grow: 1;
`;

const statusMap = {
  // xtungvo TODO: apply i18n
  pending: 'Not Started',
  done: 'Done',
  inprogress: 'In Progress'
};

interface IBountyCardProps {
  bounty: TBountyCard;
}

export default function BountyCard ({ bounty }: IBountyCardProps) {
  const [bountyDialogOpen, setBountyDialogOpen] = useState(false);
  const { updateBounty } = useBounty();
  const { id, title, type, status } = bounty;

  const handleUpdateBounty = (updatingBounty: TBountyCard) => {
    updateBounty(updatingBounty);
    setBountyDialogOpen(false);
  };

  return (
    <>
      <Card
        key={id}
        sx={{
          width: 290,
          height: 228,
          borderRadius: 10,
          border: '1px solid',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer'
        }}
        onClick={() => {
          setBountyDialogOpen(true);
        }}
      >
        <StyledTitled>{title}</StyledTitled>
        <Stack direction='row' spacing={2} mt={2}>
          <Chip label={statusMap[status]} color='primary' />
          <Chip label={type.toUpperCase()} color='secondary' />
        </Stack>
        <CardActions>
          <Button
            variant='outlined'
            sx={{ marginTop: '16px', width: '120px', marginLeft: 'auto' }}
            onClick={() => {
              setBountyDialogOpen(true);
            }}
          >
            APPLY
          </Button>
        </CardActions>
      </Card>
      <BountyModal
        open={bountyDialogOpen}
        onClose={() => setBountyDialogOpen(false)}
        modalType='edit'
        bounty={bounty}
        onSubmit={handleUpdateBounty}
      />
    </>
  );
}
