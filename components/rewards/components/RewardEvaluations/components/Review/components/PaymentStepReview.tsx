import LaunchIcon from '@mui/icons-material/Launch';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { getChainExplorerLink } from '@packages/connectors/chains';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { useGetRewardPermissions } from 'charmClient/hooks/rewards';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { RewardAmount } from 'components/rewards/components/RewardAmount';
import { RewardPaymentButton } from 'components/rewards/components/RewardApplicationPage/components/RewardPaymentButton';
import { useSnackbar } from 'hooks/useSnackbar';
import { getSafeApiClient } from 'lib/gnosis/safe/getSafeApiClient';
import { getGnosisTransactionUrl } from 'lib/gnosis/utils';
import type { ApplicationWithTransactions, RewardWithUsers } from 'lib/rewards/interfaces';

type PaymentStepReviewActionProps = {
  reward: RewardWithUsers;
  application: ApplicationWithTransactions;
  refreshApplication?: () => void;
  hidePaymentButton?: boolean;
};

function PaymentStepReviewAction({
  hidePaymentButton,
  application,
  refreshApplication,
  reward
}: PaymentStepReviewActionProps) {
  const { data: rewardPermissions } = useGetRewardPermissions({ rewardId: reward.id });
  const reviewPermission = rewardPermissions?.review;

  const { open, isOpen, close } = usePopupState({ variant: 'dialog', popupId: 'confirm-mark-submission-paid' });
  const { showMessage } = useSnackbar();
  const [pendingSafeTransactionUrl, setPendingSafeTransactionUrl] = useState<string | null>(null);

  useEffect(() => {
    if (application.status === 'processing' && application.transactions.length) {
      const safeTransaction = application.transactions.find((_tx) => !!_tx.safeTxHash);

      if (safeTransaction) {
        const chainId = Number(safeTransaction.chainId);
        getSafeApiClient({ chainId }).then((safeApiClient) => {
          safeApiClient.getTransaction(safeTransaction.safeTxHash as string).then((txData) => {
            setPendingSafeTransactionUrl(
              getGnosisTransactionUrl(txData.safe, chainId, safeTransaction.safeTxHash as string)
            );
          });
        });
      }
    }
  }, [application.status, application.transactions.length]);

  async function markAsPaid() {
    await charmClient.rewards.markSubmissionAsPaid(application.id);
    close();
    refreshApplication?.();
  }

  async function recordTransaction(transactionId: string, chainId: number) {
    try {
      await charmClient.rewards.recordTransaction({
        applicationId: application.id,
        chainId: chainId.toString(),
        transactionId
      });
      await charmClient.rewards.markSubmissionAsPaid(application.id);
      refreshApplication?.();
    } catch (err: any) {
      showMessage(err.message || err, 'error');
    }
  }

  return (
    <>
      {application.status === 'complete' && reward.rewardType === 'token' && reviewPermission && !hidePaymentButton && (
        <Stack justifyContent='flex-end' flexDirection='row'>
          <Box width='fit-content'>
            <RewardPaymentButton
              buttonSize='medium'
              amount={String(reward.rewardAmount)}
              chainIdToUse={reward.chainId as number}
              receiver={application.walletAddress as string}
              reward={reward}
              tokenSymbolOrAddress={reward.rewardToken as string}
              onSuccess={recordTransaction}
              onError={(message) => showMessage(message, 'warning')}
              submission={application}
              refreshSubmission={refreshApplication ?? (() => {})}
            />
          </Box>
        </Stack>
      )}

      {application.status === 'complete' && reward.rewardType === 'custom' && reviewPermission && (
        <Stack justifyContent='flex-end' flexDirection='row'>
          <Box width='fit-content'>
            <Button data-test='mark-paid-button' onClick={open}>
              Mark as paid
            </Button>
          </Box>
        </Stack>
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

      {application.status === 'processing' && pendingSafeTransactionUrl && (
        <Button variant='outlined' color='secondary' external target='_blank' href={pendingSafeTransactionUrl}>
          <LaunchIcon sx={{ mr: 1 }} />
          View pending transaction
        </Button>
      )}
      <Modal title='Confirm payment' open={isOpen} onClose={close}>
        <Box>
          <Typography sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
            Please confirm you want to mark this reward as paid
          </Typography>
          <Box display='flex' gap={2} mt={3}>
            <Button color='success' onClick={markAsPaid} data-test='confirm-mark-paid-button'>
              Confirm
            </Button>

            <Button variant='outlined' color='secondary' onClick={close}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

export function PaymentStepReview({
  reward,
  application,
  refreshApplication,
  hidePaymentButton
}: Pick<PaymentStepReviewActionProps, 'reward' | 'refreshApplication'> & {
  application?: ApplicationWithTransactions;
  hidePaymentButton?: boolean;
}) {
  return (
    <Stack gap={2}>
      <Grid container direction='column' alignItems='center'>
        <Grid item xs width='100%' display='flex' flexDirection='column' sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              width: '100%',
              justifyContent: 'space-between',
              gap: 1,
              alignItems: 'center',
              minHeight: '30px'
            }}
          >
            <RewardAmount
              truncatePrecision={4}
              noRewardText='No reward available'
              fullForm
              showFullCustomRewardText
              reward={reward}
            />
          </Box>
        </Grid>
      </Grid>
      {application && (
        <PaymentStepReviewAction
          hidePaymentButton={hidePaymentButton}
          reward={reward}
          application={application}
          refreshApplication={refreshApplication}
        />
      )}
    </Stack>
  );
}
