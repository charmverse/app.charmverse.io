import { Button } from '@mui/material';
import { Box } from '@mui/system';
import { useBounties } from 'hooks/useBounties';
import { useState } from 'react';
import { BountyBadge } from './BountyBadge';
import BountyModal from './BountyModal';

interface BountyIntegrationProps {
  linkedTaskId: string
  title?: string
}

export function BountyIntegration (props: BountyIntegrationProps) {
  const { bounties } = useBounties();
  const { title, linkedTaskId } = props;
  const linkedBounty = bounties.find(bounty => bounty.linkedTaskId === linkedTaskId);

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Box sx={{
      whiteSpace: 'nowrap'
    }}
    >
      {linkedBounty ? <BountyBadge bounty={linkedBounty} /> : (
        <>
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
        </>
      )}
    </Box>
  );
}
