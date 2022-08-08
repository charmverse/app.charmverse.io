
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { Box, Tooltip, Typography } from '@mui/material';
import Link from 'components/common/Link';
import { getChainExplorerLink } from 'connectors';
import { ApplicationWithTransactions } from 'lib/applications/actions';

interface Props {
  submission: ApplicationWithTransactions;
}

export default function BountyApplicantActions ({ submission }: Props) {

  return (
    <>
      {submission.status === 'inProgress' && (
        <Typography color='secondary' variant='body2'>
          In Progress
        </Typography>
      )}

      {submission.status === 'rejected' && (
        <Typography color='error' variant='body2'>
          Rejected
        </Typography>
      )}

      {submission.status === 'complete' && (
        <Typography color='secondary' variant='body2'>
          Needs payment
        </Typography>
      )}

      {submission.status === 'applied' && (
        <Typography color='secondary' variant='body2'>
          Application submitted
        </Typography>
      )}

      {submission.status === 'review' && (
        <Typography color='secondary' variant='body2'>
          Awaiting review
        </Typography>
      )}

      {submission.status === 'paid' && (
        <Link
          external
          href={submission.transactions[0] ? getChainExplorerLink(submission.transactions[0].chainId, submission.transactions[0].transactionId) : ''}
          target='_blank'
        >
          <Tooltip title={submission.transactions[0] ? 'View transaction' : ''} placement='top' arrow>
            <Typography color='success' variant='body2'>
              {'Paid '}
              <LaunchIcon sx={{ fontSize: 14 }} />
            </Typography>
          </Tooltip>
        </Link>
      )}

    </>
  );
}
