import type { Application } from '@charmverse/core/prisma';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { Box, Tooltip, Typography } from '@mui/material';
import { getChainExplorerLink } from 'connectors/chains';

import Link from 'components/common/Link';
import { useGnosisTransaction } from 'hooks/useGnosisTransaction';
import type { ApplicationWithTransactions } from 'lib/applications/actions';
import { isTruthy } from 'lib/utilities/types';

interface Props {
  submission: ApplicationWithTransactions | Application;
}

export function BountyApplicantStatus({ submission }: Props) {
  const transaction = (submission as ApplicationWithTransactions).transactions?.[0];
  const { safeTxUrl } = useGnosisTransaction({ tx: transaction });

  return (
    <>
      {submission.status === 'inProgress' && (
        <Typography color='secondary' variant='body2'>
          Awaiting submission
        </Typography>
      )}

      {submission.status === 'rejected' && (
        <Typography color='error' variant='body2'>
          Rejected
        </Typography>
      )}

      {submission.status === 'complete' && (
        <Typography color='secondary' variant='body2'>
          Awaiting payment
        </Typography>
      )}

      {submission.status === 'processing' &&
        (safeTxUrl ? (
          <Link external href={safeTxUrl} target='_blank' display='inline-flex'>
            <Tooltip title='View gnosis safe' placement='top' arrow>
              <Box display='flex' alignItems='center' gap={0.5}>
                <Typography color='success' variant='body2'>
                  Processing payment
                </Typography>
                <LaunchIcon sx={{ fontSize: 14 }} />
              </Box>
            </Tooltip>
          </Link>
        ) : (
          <Typography color='secondary' variant='body2'>
            Processing payment
          </Typography>
        ))}

      {submission.status === 'cancelled' && (
        <Typography color='error' variant='body2'>
          Payment cancelled
        </Typography>
      )}

      {submission.status === 'applied' && (
        <Typography color='secondary' variant='body2'>
          Awaiting assignment
        </Typography>
      )}

      {submission.status === 'review' && (
        <Typography color='secondary' variant='body2'>
          Awaiting review
        </Typography>
      )}

      {submission.status === 'paid' &&
        (transaction && isTruthy(transaction.chainId) && isTruthy(transaction.transactionId) ? (
          <Link
            external
            href={transaction ? getChainExplorerLink(transaction.chainId, transaction.transactionId) : ''}
            target='_blank'
            display='inline-flex'
          >
            <Tooltip title={transaction ? 'View transaction' : ''} placement='top' arrow>
              <Box display='flex' alignItems='center' gap={0.5}>
                <Typography color='success' variant='body2'>
                  {'Paid '}
                </Typography>
                <LaunchIcon sx={{ fontSize: 14 }} />
              </Box>
            </Tooltip>
          </Link>
        ) : (
          <Typography color='success' variant='body2'>
            {'Paid '}
          </Typography>
        ))}
    </>
  );
}
