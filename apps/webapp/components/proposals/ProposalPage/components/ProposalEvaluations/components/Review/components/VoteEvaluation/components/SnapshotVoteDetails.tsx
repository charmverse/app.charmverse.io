import PublishIcon from '@mui/icons-material/ElectricBolt';
import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';

import { OpenWalletSelectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/OpenWalletSelectorButton';
import { Button } from 'components/common/Button';
import { VotesWrapper } from 'components/common/CharmEditor/components/inlineVote/components/VotesWrapper';
import Loader from 'components/common/LoadingComponent';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { percent } from '@packages/lib/utils/numbers';

import { useSnapshotVoting } from '../hooks/useSnapshotVoting';

import { SnapshotVotingForm } from './SnapshotVotingForm/SnapshotVotingForm';

type Props = {
  snapshotProposalId: string;
};

export function SnapshotVoteDetails({ snapshotProposalId }: Props) {
  const {
    snapshotProposal,
    userVotes,
    votingPower,
    isVotingActive,
    remainingTime,
    hasPassedDeadline,
    proposalEndDate,
    votingDisabledStatus,
    castSnapshotVote
  } = useSnapshotVoting({
    snapshotProposalId
  });
  const { formatDate } = useDateFormatter();
  // Either the number of votes or tokens

  const voteChoices = snapshotProposal?.choices ?? [];
  const voteScores = snapshotProposal?.scores ?? [];

  const flatUserChoices = (userVotes ?? []).reduce((acc, v) => {
    if (typeof v.choice === 'number') {
      acc.push(v.choice);
    }

    if (Array.isArray(v.choice)) {
      v.choice.forEach((c) => acc.push(c));
    }

    return acc;
  }, [] as number[]);

  const currentUserChoices = flatUserChoices.map((v) => voteChoices[v - 1]).join(',');

  const isLoading = snapshotProposal === undefined;
  let statusText = 'Loading...';

  if (snapshotProposal) {
    if (snapshotProposal.state === 'pending') {
      statusText = 'Pending';
    } else if (hasPassedDeadline) {
      statusText = `Voting ended on ${formatDate(new Date(proposalEndDate))}`;
    } else {
      statusText = `Voting ends ${remainingTime}`;
    }
  } else if (!isLoading) {
    statusText = 'Not found';
  }

  return (
    <VotesWrapper id={`vote.${snapshotProposalId}`}>
      <Box
        display='flex'
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        gap={1}
        alignItems='center'
      >
        <Typography color='secondary' variant='subtitle1'>
          Status: {statusText}
        </Typography>
        <Button
          startIcon={<PublishIcon />}
          href={`https://snapshot.org/#/${snapshotProposal?.space.id}/proposal/${snapshotProposal?.id}`}
          color='secondary'
          variant='text'
          external
          target='_blank'
          disabled={!snapshotProposal}
        >
          View on Snapshot
        </Button>
      </Box>

      <Divider sx={{ mb: 1, mt: 1 }} />

      {!snapshotProposal && isLoading && <Loader isLoading={true} />}

      {!snapshotProposal && !isLoading && <Alert severity='warning'>Proposal not found on Snapshot</Alert>}

      {snapshotProposal && (
        <Box display='flex' flexDirection='column' gap={1}>
          {isVotingActive ? (
            <Box>
              <Stack mb={1}>
                {votingDisabledStatus && (
                  <Alert
                    sx={{ alignItems: 'center' }}
                    severity='warning'
                    action={
                      votingDisabledStatus.reason === 'account' ? <OpenWalletSelectorButton color='inherit' /> : null
                    }
                  >
                    {votingDisabledStatus.message}
                  </Alert>
                )}
              </Stack>
              <SnapshotVotingForm
                snapshotProposal={snapshotProposal}
                votingPower={votingPower}
                userVotes={userVotes}
                castVote={castSnapshotVote}
              />
            </Box>
          ) : (
            voteChoices.map((voteOption, index) => (
              <Box key={voteOption} display='flex' justifyContent='space-between'>
                <Box gap={1} display='flex'>
                  {voteOption}
                  {currentUserChoices.includes(voteOption) && <Chip color='teal' size='small' label='Voted' />}
                </Box>
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
            ))
          )}
        </Box>
      )}
    </VotesWrapper>
  );
}
