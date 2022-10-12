import PublishIcon from '@mui/icons-material/ElectricBolt';
import { Box, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import type { Proposal } from '@prisma/client';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import Loader from 'components/common/LoadingComponent';
import VoteStatusChip from 'components/votes/components/VoteStatusChip';
import type { SnapshotProposal, SnapshotVote } from 'lib/snapshot';
import { getSnapshotProposal, getUserProposalVotes } from 'lib/snapshot';
import { coerceToMilliseconds, humanFriendlyDate, relativeTime } from 'lib/utilities/dates';
import { percent } from 'lib/utilities/numbers';

import { StyledFormControl, VotesWrapper } from './VotesWrapper';

type Props = {
  snapshotProposalId: string;
  proposalId: string;
}

export function SnapshotVoteDetails ({ snapshotProposalId, proposalId }: Props) {

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [snapshotProposal, setSnapshotProposal] = useState<SnapshotProposal | null>(null);
  const [userVotes, setUserVotes] = useState<SnapshotVote[]>([]);
  const [loading, setLoading] = useState(true);

  const proposalEndDate = coerceToMilliseconds(snapshotProposal?.end ?? 0);

  // Address to use for getting votes (95K aave)
  const account = '0x070341aA5Ed571f0FB2c4a5641409B1A46b4961b';

  // For the active proposal
  //  const account = '0x344d5A4da2329A885b24aeC4C8937e20Cd67b112';

  // Either the number of votes or tokens

  const voteChoices = snapshotProposal?.choices ?? [];
  const voteScores = snapshotProposal?.scores ?? [];

  useEffect(() => {

    getSnapshotProposal(snapshotProposalId)
      .then((_snapshotProposal) => {
        setSnapshotProposal(_snapshotProposal);
        setLoading(false);

        getUserProposalVotes({ proposalId: snapshotProposalId, walletAddress: account })
          .then(foundVotes => setUserVotes(foundVotes));
      });

    charmClient.proposals.getProposal(proposalId)
      .then(_proposal => setProposal(_proposal));

  }, []);

  const hasPassedDeadline = proposalEndDate < Date.now();

  useEffect(() => {
    if (snapshotProposal && hasPassedDeadline && proposal) {
      charmClient.proposals.updateStatus(proposalId, 'vote_closed')
        .then(updatedProposal => {
          setProposal(updatedProposal);
        });
    }
  }, [snapshotProposal, proposal]);
  const remainingTime = relativeTime(proposalEndDate);

  const currentUserChoices = userVotes.map(v => voteChoices[v.choice - 1]).join(',');

  return (
    <VotesWrapper id={`vote.${snapshotProposalId}`}>
      <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
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
                      <Typography variant='subtitle1' color='secondary'>{percent({ value: voteScores[index], total: snapshotProposal.scores_total, significantDigits: 2 })}</Typography>
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
