import { Button, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';
import BountyModal from './BountyModal';

interface BountyIntegrationProps {
  linkedTaskId: string
  title?: string
}

export function BountyIntegration (props: BountyIntegrationProps) {
  const { title, linkedTaskId } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 1
    }}
    >
      <Typography
        variant='h5'
        sx={{
          textTransform: 'uppercase',
          fontWeight: 'bold',
          textAlign: 'center'
        }}
      >
        No bounties assigned
      </Typography>
      <Button onClick={() => {
        setIsModalOpen(true);
      }}
      >
        Assign a bounty
      </Button>
      {isModalOpen && (
      <BountyModal
        open={isModalOpen}
        bounty={{
          title,
          linkedTaskId
        }}
        onClose={() => {
          setIsModalOpen(false);
        }}
        onSubmit={() => {
          setIsModalOpen(false);
        }}
      />
      )}
    </Box>
  );
}
