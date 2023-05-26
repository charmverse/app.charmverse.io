import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PaidIcon from '@mui/icons-material/Paid';
import { MenuItem, ListItemText, Tooltip } from '@mui/material';
import { useSWRConfig } from 'swr';

import charmClient from 'charmClient';
import { useBounties } from 'hooks/useBounties';
import { useBountyPermissions } from 'hooks/useBountyPermissions';
import { useSnackbar } from 'hooks/useSnackbar';
import { paidBountyStatuses } from 'lib/bounties/constants';

export function BountyActions({ bountyId, onClick }: { bountyId: string; onClick?: VoidFunction }) {
  const { refreshBounty, bounties } = useBounties();
  const { mutate } = useSWRConfig();
  const { showMessage } = useSnackbar();

  const { permissions: bountyPermissions } = useBountyPermissions({
    bountyId
  });
  const bounty = bounties.find((_bounty) => _bounty.id === bountyId);

  if (!bounty) {
    return null;
  }

  const isMarkBountyPaidEnabled =
    bountyPermissions?.userPermissions.mark_paid &&
    bounty.status !== 'paid' &&
    bounty.applications.length > 0 &&
    bounty.applications.every((application) => paidBountyStatuses.includes(application.status));

  const isMarkBountyCompletedEnabled =
    bountyPermissions?.userPermissions.lock && (bounty?.status === 'inProgress' || bounty.status === 'open');

  async function markBountyAsPaid() {
    try {
      await charmClient.bounties.markBountyAsPaid(bountyId);
      if (refreshBounty) {
        refreshBounty(bountyId);
      }
      await mutate(`/bounties/${bountyId}/applications`);
      onClick?.();
    } catch (error) {
      showMessage((error as Error)?.message || (error as any), 'error');
    }
  }

  async function closeBounty() {
    try {
      await charmClient.bounties.closeBounty(bountyId);
      if (refreshBounty) {
        refreshBounty(bountyId);
      }
      onClick?.();
    } catch (error) {
      showMessage((error as Error)?.message || (error as any), 'error');
    }
  }

  const disabledMarkBountyPaidTooltipMessage = !bountyPermissions?.userPermissions.mark_paid
    ? "You don't have permission to mark this bounty as paid"
    : `All applications must be completed or marked as paid to mark this bounty as paid`;
  const disabledMarkBountyCompletedTooltipMessage = !bountyPermissions?.userPermissions.lock
    ? `You don't have permission to mark this bounty as complete`
    : 'This bounty cannot be marked as complete';

  return (
    <>
      <Tooltip title={!isMarkBountyPaidEnabled ? disabledMarkBountyPaidTooltipMessage : ''}>
        <div>
          <MenuItem dense onClick={markBountyAsPaid} disabled={!isMarkBountyPaidEnabled}>
            <PaidIcon
              sx={{
                mr: 1
              }}
              fontSize='small'
            />
            <ListItemText primary='Mark paid' />
          </MenuItem>
        </div>
      </Tooltip>
      <Tooltip title={!isMarkBountyCompletedEnabled ? disabledMarkBountyCompletedTooltipMessage : ''}>
        <div>
          <MenuItem dense onClick={closeBounty} disabled={!isMarkBountyCompletedEnabled}>
            <CheckCircleOutlinedIcon
              sx={{
                mr: 1
              }}
              fontSize='small'
            />
            <ListItemText primary='Mark complete' />
          </MenuItem>
        </div>
      </Tooltip>
    </>
  );
}
