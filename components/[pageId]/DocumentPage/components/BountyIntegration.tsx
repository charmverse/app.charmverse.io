import { Button } from '@mui/material';
import { Box } from '@mui/system';
import { useBounties } from 'hooks/useBounties';
import { useState } from 'react';
import BountyStatusBadge from '../../../bounties/components/BountyStatusBadge';
import BountyModal from '../../../bounties/components/BountyModal';

interface BountyIntegrationProps {
  linkedTaskId: string
  title?: string
  readonly?: boolean
}

export default function BountyIntegration (props: BountyIntegrationProps) {
  const { bounties } = useBounties();
  const { title, linkedTaskId } = props;
  const linkedBounty = bounties.find(bounty => bounty.linkedTaskId === linkedTaskId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <Box sx={{
      whiteSpace: 'nowrap'
    }}
    >
      {linkedBounty ? <BountyStatusBadge layout='stacked' bounty={linkedBounty} />
        : props.readonly ? null : (
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
