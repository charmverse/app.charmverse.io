import PublishIcon from '@mui/icons-material/ElectricBolt';
import { Box, Divider, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import useSWR from 'swr';

import { Button } from 'components/common/Button';
import Loader from 'components/common/LoadingComponent';
import VoteStatusChip from 'components/votes/components/VoteStatusChip';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { SnapshotProposal } from 'lib/snapshot';
import { getSnapshotProposal, getUserProposalVotes } from 'lib/snapshot';
import { coerceToMilliseconds, relativeTime } from 'lib/utilities/dates';
import { percent } from 'lib/utilities/numbers';

import { VotesWrapper } from './VotesWrapper';

type Props = {
  snapshotProposalId: string;
};

export function SnapshotVoteDetails({ snapshotProposalId }: Props) {
  const { account } = useWeb3AuthSig();
  const { data: snapshotProposal } = useSWR<SnapshotProposal | null>(`/snapshotProposal/${snapshotProposalId}`, () =>
    getSnapshotProposal(snapshotProposalId)
  );
  const { data: userVotes } = useSWR(account ? `snapshotUserVotes-${account}` : null, () =>
    getUserProposalVotes({ walletAddress: account as string, snapshotProposalId })
  );
  const { formatDate } = useDateFormatter();

  const loading = snapshotProposal === undefined;

  const proposalEndDate = coerceToMilliseconds(snapshotProposal?.end ?? 0);

  // Either the number of votes or tokens

  const voteChoices = snapshotProposal?.choices ?? [];
  const voteScores = snapshotProposal?.scores ?? [];

  const hasPassedDeadline = proposalEndDate < Date.now();

  const remainingTime = relativeTime(proposalEndDate);

  return (
    <VotesWrapper id={`vote.${snapshotProposalId}`}>
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
        <Typography color='secondary' variant='subtitle1'>
          {!snapshotProposal && loading && 'Loading...'}
          {snapshotProposal &&
            (hasPassedDeadline
              ? `Voting ended on ${formatDate(new Date(proposalEndDate))}`
              : `Voting ends ${remainingTime}`)}
        </Typography>
        <Button
          startIcon={<PublishIcon />}
          href={`https://snapshot.org/#/${snapshotProposal?.space.id}/proposal/${snapshotProposal?.id}`}
          color={hasPassedDeadline ? 'secondary' : 'primary'}
          variant={hasPassedDeadline ? 'outlined' : 'contained'}
          external
          target='_blank'
          disabled={!snapshotProposal}
        >
          {hasPassedDeadline ? 'View' : 'Vote'} on snapshot
        </Button>
      </Box>

      {!snapshotProposal && loading && <Loader isLoading={true} />}

      {!snapshotProposal && !loading && <Alert severity='warning'>Proposal not found on Snapshot</Alert>}

      {snapshotProposal && <Divider sx={{ my: 2 }} />}
      {snapshotProposal && (
        <Box display='flex' flexDirection='column' gap={1}>
          {voteChoices.map((voteOption, index) => (
            <Box key={voteOption} display='flex' justifyContent='space-between'>
              <span>{voteOption}</span>
              <Typography variant='subtitle1' color='secondary'>
                {!voteScores[index]
                  ? 'No votes yet'
                  : percent({
                      value: voteScores[index],
                      total: snapshotProposal.scores_total,
                      significantDigits: 2
                    })}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </VotesWrapper>
  );
}
