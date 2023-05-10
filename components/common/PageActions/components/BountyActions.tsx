import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PaidIcon from '@mui/icons-material/Paid';
import { MenuItem, ListItemText, Tooltip } from '@mui/material';
import { useSWRConfig } from 'swr';

import charmClient from 'charmClient';
import { useBounties } from 'hooks/useBounties';
import { useSnackbar } from 'hooks/useSnackbar';

export function BountyActions({ bountyId, onClick }: { bountyId: string; onClick?: VoidFunction }) {
  const { refreshBounty, bounties } = useBounties();
  const { mutate } = useSWRConfig();
  const { showMessage } = useSnackbar();
  const bounty = bounties.find((_bounty) => _bounty.id === bountyId);

  if (!bounty) {
    return null;
  }

  const isMarkBountyPaidButtonDisabled =
    (bounty?.applications.length === 0 ||
      !bounty?.applications.every(
        (application) =>
          application.status === 'paid' || application.status === 'complete' || application.status !== 'rejected'
      )) ??
    true;

  const isMarkBountyCompletedButtonDisabled =
    (bounty?.status === 'complete' || (bounty?.status !== 'inProgress' && bounty?.status !== 'open')) ?? true;

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

  return (
    <>
      <Tooltip title={isMarkBountyPaidButtonDisabled ? `You don't have permission to mark this bounty as paid` : ''}>
        <div>
          <MenuItem dense onClick={markBountyAsPaid} disabled={isMarkBountyPaidButtonDisabled}>
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
      <Tooltip
        title={isMarkBountyCompletedButtonDisabled ? `You don't have permission to mark this bounty as complete` : ''}
      >
        <div>
          <MenuItem dense onClick={closeBounty} disabled={isMarkBountyCompletedButtonDisabled}>
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
