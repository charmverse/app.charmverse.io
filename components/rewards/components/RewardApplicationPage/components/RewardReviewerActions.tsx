import LaunchIcon from '@mui/icons-material/Launch';
import { Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { getChainExplorerLink } from 'connectors/chains';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useSnackbar } from 'hooks/useSnackbar';
import type { BountyPermissionFlags } from 'lib/permissions/bounties';
import type { ApplicationWithTransactions, RewardWithUsers } from 'lib/rewards/interfaces';
import type { ReviewDecision } from 'lib/rewards/reviewApplication';

import { AcceptOrRejectButtons } from './AcceptOrRejectButtons';
import { RewardPaymentButton } from './RewardPaymentButton';

type Props = {
  reward: RewardWithUsers;
  rewardPermissions?: BountyPermissionFlags;
  application: ApplicationWithTransactions;
  refreshApplication: () => void;
  reviewApplication: (input: { decision: ReviewDecision }) => Promise<void>;
  hasCustomReward: boolean;
  hasApplicationSlots: boolean;
};
export function RewardReviewerActions({
  application,
  reward,
  refreshApplication,
  rewardPermissions,
  reviewApplication,
  hasCustomReward,
  hasApplicationSlots
}: Props) {
  const { showMessage } = useSnackbar();

  const { open, isOpen, close } = usePopupState({ variant: 'dialog', popupId: 'confirm-mark-submission-paid' });

  async function recordTransaction(transactionId: string, chainId: number) {
    try {
      await charmClient.rewards.recordTransaction({
        applicationId: application.id,
        chainId: chainId.toString(),
        transactionId
      });
      await charmClient.rewards.markSubmissionAsPaid(application.id);
      refreshApplication();
    } catch (err: any) {
      showMessage(err.message || err, 'error');
    }
  }

  async function markAsPaid() {
    await charmClient.rewards.markSubmissionAsPaid(application.id);
    close();
    refreshApplication();
  }

  return (
    <div>
      {/** This section contains all possible reviewer actions */}
      {application.status === 'applied' && rewardPermissions?.review && (
        <AcceptOrRejectButtons
          onConfirmReview={(decision) => reviewApplication({ decision })}
          reviewType='application'
          readOnly={!rewardPermissions?.approve_applications}
          hasApplicationSlots={hasApplicationSlots}
        />
      )}
      {application.status === 'review' && rewardPermissions?.review && (
        <AcceptOrRejectButtons
          onConfirmReview={(decision) => reviewApplication({ decision })}
          reviewType='submission'
          readOnly={!rewardPermissions?.review}
          hasApplicationSlots={hasApplicationSlots}
        />
      )}
      {application.status === 'complete' && !hasCustomReward && rewardPermissions?.review && (
        <RewardPaymentButton
          amount={String(reward.rewardAmount)}
          chainIdToUse={reward.chainId as number}
          receiver={application.walletAddress as string}
          reward={reward}
          tokenSymbolOrAddress={reward.rewardToken as string}
          onSuccess={recordTransaction}
          onError={(message) => showMessage(message, 'warning')}
          submission={application}
        />
      )}

      {application.status === 'complete' && hasCustomReward && rewardPermissions?.review && (
        <Button onClick={open}>Mark as paid</Button>
      )}

      {application.status === 'paid' && !!application.transactions.length && (
        <Button
          variant='outlined'
          color='secondary'
          external
          target='_blank'
          href={getChainExplorerLink(application.transactions[0].chainId, application.transactions[0].transactionId)}
        >
          <LaunchIcon sx={{ mr: 1 }} />
          View transaction
        </Button>
      )}
      <Modal title='Confirm payment' open={isOpen} onClose={close}>
        <Box>
          <Typography sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
            Please confirm you want to mark this reward as paid
          </Typography>
          <Box display='flex' gap={2} mt={3}>
            <Button color='success' onClick={markAsPaid}>
              Confirm
            </Button>

            <Button variant='outlined' color='secondary' onClick={close}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
