import PublishIcon from '@mui/icons-material/ElectricBolt';
import { Box, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import Button from 'components/common/Button';
import Loader from 'components/common/LoadingComponent';
import VoteStatusChip from 'components/votes/components/VoteStatusChip';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { SnapshotProposal } from 'lib/snapshot';
import { getSnapshotProposal, getUserProposalVotes } from 'lib/snapshot';
import { coerceToMilliseconds, humanFriendlyDate, relativeTime } from 'lib/utilities/dates';
import { percent } from 'lib/utilities/numbers';

import { StyledFormControl, VotesWrapper } from './VotesWrapper';

type Props = {
  snapshotProposalId: string;
}

export function SnapshotVoteDetails ({ snapshotProposalId }: Props) {
  const { account } = useWeb3AuthSig();
  const { data: snapshotProposal } = useSWR<SnapshotProposal | null>(`/snapshotProposal/${snapshotProposalId}`, () => getSnapshotProposal(snapshotProposalId));
  const { data: userVotes } = useSWR(account ? `snapshotUserVotes-${account}` : null, () => getUserProposalVotes({ walletAddress: account as string, snapshotProposalId }));

  const loading = snapshotProposal === undefined;

  const proposalEndDate = coerceToMilliseconds(snapshotProposal?.end ?? 0);

  // Either the number of votes or tokens

  const voteChoices = snapshotProposal?.choices ?? [];
  const voteScores = snapshotProposal?.scores ?? [];

  const hasPassedDeadline = proposalEndDate < Date.now();

  const remainingTime = relativeTime(proposalEndDate);

  const currentUserChoices = (userVotes ?? []).map(v => voteChoices[v.choice - 1]).join(',');

  return (
    <VotesWrapper id={`vote.${snapshotProposalId}`}>
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
        <Typography variant='h6' fontWeight='bold'>
          Snapshot votes on this proposal
        </Typography>

        <Button
          startIcon={<PublishIcon />}
          href={`https://snapshot.org/#/${snapshotProposal?.space.id}/proposal/${snapshotProposal?.id}`}
          size='small'
          color='secondary'
          variant='outlined'
          external
          target='_blank'
          disabled={!snapshotProposal}
        >
          View on snapshot
        </Button>

      </Box>
      <Box display='flex' justifyContent='space-between'>
        <Typography
          color='secondary'
          variant='subtitle1'
        >
          {
            !snapshotProposal && loading && 'Loading...'
          }
          {snapshotProposal
            && (hasPassedDeadline ? `Finished on ${humanFriendlyDate(proposalEndDate, { withYear: true })}` : `Finishes ${remainingTime}`)}
        </Typography>
        {
          snapshotProposal && (
            <VoteStatusChip size='small' status={hasPassedDeadline ? 'Complete' : 'InProgress'} />
          )
        }

      </Box>

      {
        !snapshotProposal && loading && (
          <Loader isLoading={true} />
        )
      }

      {
        !snapshotProposal && !loading && (
          <Alert severity='warning'>Proposal not found on Snapshot</Alert>
        )
      }

      {
        snapshotProposal && (
          <StyledFormControl>
            <RadioGroup name={snapshotProposal.id} value={currentUserChoices as any}>
              {voteChoices.map((voteOption, index) => (
                <FormControlLabel
                  key={voteOption}
                  control={<Radio size='small' />}
                  disabled
                  value={voteOption}
                  label={(
                    <Box display='flex' justifyContent='space-between' flexGrow={1}>
                      <span>{voteOption}</span>
                      <Typography variant='subtitle1' color='secondary'>{!voteScores[index] ? 'No votes yet' : percent({ value: voteScores[index], total: snapshotProposal.scores_total, significantDigits: 2 })}</Typography>
                    </Box>
                  )}
                  disableTypography
                />
              ))}
            </RadioGroup>
          </StyledFormControl>
        )
      }

    </VotesWrapper>
  );
}
