import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PaidIcon from '@mui/icons-material/Paid';
import { ListItemButton, ListItemText, Tooltip } from '@mui/material';
import { useSWRConfig } from 'swr';

import charmClient from 'charmClient';
import { useBounties } from 'hooks/useBounties';

export function BountyActions({ bountyId, onClick }: { bountyId: string; onClick?: VoidFunction }) {
  const { refreshBounty, bounties } = useBounties();
  const { mutate } = useSWRConfig();
  const bounty = bounties.find((_bounty) => _bounty.id === bountyId);

  if (!bounty) {
    return null;
  }

  const isMarkBountyPaidButtonDisabled =
    (bounty?.applications.length === 0 ||
      !bounty?.applications.every(
        (application) => application.status === 'paid' || application.status === 'complete'
      )) ??
    true;

  const isMarkBountyCompletedButtonDisabled =
    (bounty?.status === 'complete' || (bounty?.status !== 'inProgress' && bounty?.status !== 'open')) ?? true;

  async function markBountyAsPaid() {
    await charmClient.bounties.markBountyAsPaid(bountyId);
    if (refreshBounty) {
      refreshBounty(bountyId);
    }
    await mutate(`/bounties/${bountyId}/applications`);
    onClick?.();
  }

  async function closeBounty() {
    await charmClient.bounties.closeBounty(bountyId);
    if (refreshBounty) {
      refreshBounty(bountyId);
    }
    onClick?.();
  }

  return (
    <>
      <Tooltip title={isMarkBountyPaidButtonDisabled ? `You don't have permission to mark this bounty as paid` : ''}>
        <div>
          <ListItemButton dense onClick={() => markBountyAsPaid()} disabled={isMarkBountyPaidButtonDisabled}>
            <PaidIcon
              sx={{
                mr: 1
              }}
              fontSize='small'
            />
            <ListItemText primary='Mark paid' />
          </ListItemButton>
        </div>
      </Tooltip>
      <Tooltip
        title={isMarkBountyCompletedButtonDisabled ? `You don't have permission to mark this bounty as complete` : ''}
      >
        <div>
          <ListItemButton dense onClick={() => closeBounty()} disabled={isMarkBountyCompletedButtonDisabled}>
            <CheckCircleOutlinedIcon
              sx={{
                mr: 1
              }}
              fontSize='small'
            />
            <ListItemText primary='Mark complete' />
          </ListItemButton>
        </div>
      </Tooltip>
    </>
  );
}
