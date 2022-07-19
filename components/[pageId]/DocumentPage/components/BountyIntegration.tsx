import { Button, ButtonProps } from '@mui/material';
import { Box } from '@mui/system';
import BountyStatusBadge from 'components/bounties/components/BountyStatusBadge';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';

interface BountyIntegrationProps {
  linkedTaskId: string
  onClick: ButtonProps['onClick']
  readonly?: boolean
}

export default function BountyIntegration (props: BountyIntegrationProps) {
  const { bounties } = useBounties();
  const { onClick, linkedTaskId } = props;

  const [userSpacePermissions] = useCurrentSpacePermissions();

  const linkedBounty = bounties.find(bounty => bounty.linkedTaskId === linkedTaskId);

  return (
    <Box sx={{
      whiteSpace: 'nowrap'
    }}
    >
      {linkedBounty ? <BountyStatusBadge layout='stacked' bounty={linkedBounty} />
        : props.readonly || !userSpacePermissions?.createBounty ? null : (
          <Button onClick={onClick}>
            Assign a bounty
          </Button>
        )}
    </Box>
  );
}
