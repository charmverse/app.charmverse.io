
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { Box, Tooltip, Typography } from '@mui/material';
import { Bounty } from '@prisma/client';
import Link from 'components/common/Link';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { getChainExplorerLink } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import { ApplicationWithTransactions } from 'lib/applications/actions';
import { eToNumber } from 'lib/utilities/numbers';
import { useSnackbar } from 'hooks/useSnackbar';
import BountyPaymentButton from './BountyPaymentButton';

interface Props {
  bounty: Bounty;
  submission: ApplicationWithTransactions;
  isExpanded: boolean;
  expandRow: () => void;
}

export default function BountyApplicantActions ({ bounty, isExpanded, submission, expandRow }: Props) {

  const { refreshBounty } = useBounties();
  const { showMessage } = useSnackbar();

  async function recordTransaction (transactionId: string, chainId: number) {
    try {
      await charmClient.recordTransaction({
        applicationId: submission.id,
        chainId: chainId.toString(),
        transactionId
      });
      await charmClient.markSubmissionAsPaid(submission.id);
      await refreshBounty(bounty.id);
    }
    catch (err: any) {
      showMessage(err.message || err, 'error');
    }
  }

  return (
    <Box display='flex' justifyContent='center' alignItems='center' width='100%'>
      {submission.status === 'applied' && (
        <Button color='primary' size='small' onClick={expandRow} sx={{ opacity: isExpanded ? 0 : 1, transition: 'opacity .2s' }}>
          Review application
        </Button>
      )}

      {submission.status === 'review' && (
        <Button color='primary' size='small' onClick={expandRow} sx={{ opacity: isExpanded ? 0 : 1, transition: 'opacity .2s' }}>
          Review submission
        </Button>
      )}

      {submission.status === 'inProgress' && (
        <Typography color='secondary' variant='body2'>
          In Progress
        </Typography>
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

      {submission.status === 'rejected' && (
        <Typography color='error' variant='body2'>
          Rejected
        </Typography>
      )}

      {submission.status === 'paid' && (
        <Tooltip title={submission.transactions[0] ? 'View transaction details' : ''} placement='top' arrow>
          <Link
            external
            href={submission.transactions[0] ? getChainExplorerLink(submission.transactions[0].chainId, submission.transactions[0].transactionId) : ''}
            target='_blank'
          >
            <Typography color='success' variant='body2'>
              Paid
              <LaunchIcon fontSize='small' />
            </Typography>
          </Link>
        </Tooltip>
      )}
    </Box>
  );
}
