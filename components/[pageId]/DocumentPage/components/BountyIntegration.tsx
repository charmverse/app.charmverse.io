import { Button } from '@mui/material';
import { Box } from '@mui/system';
import BountyModal from 'components/bounties/components/BountyModal';
import BountyStatusBadge from 'components/bounties/components/BountyStatusBadge';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useState } from 'react';

interface BountyIntegrationProps {
  linkedTaskId: string
  title?: string
  readonly?: boolean
}

export default function BountyIntegration (props: BountyIntegrationProps) {
  const { bounties } = useBounties();
  const { title, linkedTaskId } = props;

  const [userSpacePermissions] = useCurrentSpacePermissions();

  const linkedBounty = bounties.find(bounty => bounty.linkedTaskId === linkedTaskId);

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Box sx={{
      whiteSpace: 'nowrap'
    }}
    >
      {linkedBounty ? <BountyStatusBadge layout='stacked' bounty={linkedBounty} />
        : props.readonly || !userSpacePermissions?.createBounty ? null : (
          <>
            <Button onClick={() => {
              setIsModalOpen(true);
            }}
            >
              Assign a bounty
            </Button>
            {isModalOpen && (
            // New Bounty, so we don't need permissions data
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
