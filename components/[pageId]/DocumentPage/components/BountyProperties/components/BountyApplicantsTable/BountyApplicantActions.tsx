import { Box, Tooltip } from '@mui/material';
import type { Bounty } from '@prisma/client';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useBounties } from 'hooks/useBounties';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ApplicationWithTransactions } from 'lib/applications/actions';
import type { BountyWithDetails } from 'lib/bounties';
import { eToNumber } from 'lib/utilities/numbers';

import BountyPaymentButton from './BountyPaymentButton';

interface Props {
  bounty: BountyWithDetails;
  submission: ApplicationWithTransactions;
  isExpanded: boolean;
  expandRow: () => void;
}

export default function BountyApplicantActions ({ bounty, isExpanded, submission, expandRow }: Props) {

  const { refreshBounty } = useBounties();
  const { showMessage } = useSnackbar();

  async function recordTransaction (transactionId: string, chainId: number) {
    try {
      await charmClient.bounties.recordTransaction({
        applicationId: submission.id,
        chainId: chainId.toString(),
        transactionId
      });
      await charmClient.bounties.markSubmissionAsPaid(submission.id);
      await refreshBounty(bounty.id);
    }
    catch (err: any) {
      showMessage(err.message || err, 'error');
    }
  }

  return (
    <Box display='flex' justifyContent='center' alignItems='center' width='100%'>
      {(submission.status === 'applied' || submission.status === 'review') && (
        <Button color='primary' size='small' onClick={expandRow} sx={{ opacity: isExpanded ? 0 : 1, transition: 'opacity .2s' }}>
          Review
        </Button>
      )}

      {submission.status === 'complete' && (
        <Box>
          {submission.walletAddress && (
            <BountyPaymentButton
              onSuccess={recordTransaction}
              onError={(errorMessage, level) => showMessage(errorMessage, level || 'error')}
              receiver={submission.walletAddress}
              amount={eToNumber(bounty.rewardAmount)}
              tokenSymbolOrAddress={bounty.rewardToken}
              chainIdToUse={bounty.chainId}
              bounty={bounty}
            />
          )}
          {!submission.walletAddress && (
            <Tooltip title='Applicant must provide a wallet address'>
              <Button color='primary' disabled={true}>
                Send Payment
              </Button>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
}
