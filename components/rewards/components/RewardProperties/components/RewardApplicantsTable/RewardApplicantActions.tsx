import type { Bounty as Reward } from '@charmverse/core/prisma-client';
import { Box, Tooltip } from '@mui/material';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useBounties } from 'hooks/useBounties';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ApplicationWithTransactions } from 'lib/applications/actions';
import type { BountyWithDetails } from 'lib/bounties';
import { eToNumber } from 'lib/utilities/numbers';
import { isTruthy } from 'lib/utilities/types';

import { RewardPaymentButton } from './RewardPaymentButton';

interface Props {
  reward: Reward;
  submission: ApplicationWithTransactions;
  isExpanded: boolean;
  expandRow: () => void;
  refreshApplication: () => void;
}

export default function BountyApplicantActions({
  reward,
  isExpanded,
  submission,
  expandRow,
  refreshApplication
}: Props) {
  const { refreshReward } = useRewards();
  const { showMessage } = useSnackbar();

  async function recordTransaction(transactionId: string, chainId: number) {
    try {
      await charmClient.rewards.recordTransaction({
        applicationId: submission.id,
        chainId: chainId.toString(),
        transactionId
      });
      await charmClient.rewards.markSubmissionAsPaid(submission.id);
      refreshReward(reward.id);
    } catch (err: any) {
      showMessage(err.message || err, 'error');
    }
  }

  async function markSubmissionAsPaid() {
    await charmClient.bounties.markSubmissionAsPaid(submission.id);
    refreshReward(reward.id);
    refreshApplication();
  }

  return (
    <Box display='flex' justifyContent='center' alignItems='center' width='100%'>
      {(submission.status === 'applied' || submission.status === 'review') && (
        <Button
          color='primary'
          size='small'
          onClick={expandRow}
          sx={{ opacity: isExpanded ? 0 : 1, transition: 'opacity .2s' }}
          data-test='review-bounty-button'
        >
          Review
        </Button>
      )}

      {submission.status === 'complete' &&
        isTruthy(reward.rewardAmount) &&
        isTruthy(reward.rewardToken) &&
        isTruthy(reward.chainId) && (
          <Box>
            {submission.walletAddress ? (
              <RewardPaymentButton
                onSuccess={recordTransaction}
                onError={(errorMessage, level) => showMessage(errorMessage, level || 'error')}
                receiver={submission.walletAddress}
                amount={eToNumber(reward.rewardAmount)}
                tokenSymbolOrAddress={reward.rewardToken}
                chainIdToUse={reward.chainId}
                reward={reward}
              />
            ) : (
              <Tooltip title='Applicant must provide a wallet address'>
                <Button color='primary' disabled={true}>
                  Send Payment
                </Button>
              </Tooltip>
            )}
          </Box>
        )}

      {submission.status === 'complete' && isTruthy(reward.customReward) && (
        <Button color='primary' size='small' onClick={markSubmissionAsPaid}>
          Mark paid
        </Button>
      )}
    </Box>
  );
}
