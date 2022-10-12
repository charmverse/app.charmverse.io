import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import PublishIcon from '@mui/icons-material/ElectricBolt';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import { Box, Card, Chip, Divider, FormControl, FormControlLabel, List, ListItem, ListItemText, Radio, RadioGroup, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import type { UserVote } from '@prisma/client';
import { DateTime } from 'luxon';
import { usePopupState } from 'material-ui-popup-state/hooks';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import CharmButton from 'components/common/Button';
import Loader from 'components/common/LoadingComponent';
import Modal from 'components/common/Modal';
import useTasks from 'components/nexus/hooks/useTasks';
import VoteActionsMenu from 'components/votes/components/VoteActionsMenu';
import VoteStatusChip from 'components/votes/components/VoteStatusChip';
import { useUser } from 'hooks/useUser';
import { removeInlineVoteMark } from 'lib/inline-votes/removeInlineVoteMark';
import type { SnapshotProposal, SnapshotVote } from 'lib/snapshot';
import { getSnapshotProposal, getUserProposalVotes } from 'lib/snapshot';
import { relativeTime } from 'lib/utilities/dates';
import { percent } from 'lib/utilities/numbers';
import type { ExtendedVote } from 'lib/votes/interfaces';
import { isVotingClosed } from 'lib/votes/utils';

import { VotesWrapper, StyledFormControl } from './VotesWrapper';

type Props = {
  snapshotProposalId: string;
}

export function SnapshotVoteDetails ({ snapshotProposalId }: Props) {

  const [snapshotProposal, setSnapshotProposal] = useState<SnapshotProposal | null>(null);
  const [userVotes, setUserVotes] = useState<SnapshotVote[]>([]);
  const [loading, setLoading] = useState(true);

  // Address to use for getting votes (95K aave)
  const account = '0x070341aA5Ed571f0FB2c4a5641409B1A46b4961b';

  // Either the number of votes or tokens
  const totalVotes = 0;

  const voteChoices = snapshotProposal?.choices ?? [];
  const voteScores = snapshotProposal?.scores ?? [];

  useEffect(() => {

    getSnapshotProposal(snapshotProposalId)
      .then((proposal) => {
        setSnapshotProposal(proposal);
        setLoading(false);

        getUserProposalVotes({ proposalId: snapshotProposalId, walletAddress: account })
          .then(foundVotes => setUserVotes(foundVotes));
      });

  }, []);

  if (loading) {
    return <Loader isLoading={true} />;
  }

  if (!snapshotProposal) {
    return <Alert severity='warning'>Proposal not found on Snapshot</Alert>;
  }

  const hasPassedDeadline = new Date(snapshotProposal.end).valueOf() < Date.now();
  const remainingTime = relativeTime(snapshotProposal.end);

  const currentUserChoices = userVotes.map(v => voteChoices[v.choice - 1]).join(',');

  return (
    <VotesWrapper id={`vote.${snapshotProposalId}`}>
      <Box display='flex' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
        <Typography variant='h6' fontWeight='bold'>
          Snapshot votes on this proposal
        </Typography>

        <CharmButton startIcon={<PublishIcon />} href={`https://snapshot.org/#/${snapshotProposal.space.id}/proposal/${snapshotProposal.id}`} size='small' color='secondary' variant='outlined' external target='_blank'>
          View on snapshot
        </CharmButton>

        {/* <Button startIcon={<PublishIcon />} href={`https://snapshot.org/#/${snapshotProposal.space.id}/proposal/${snapshotProposal.id}`} size='small' color='secondary' variant='outlined' exter>
          View on snapshot
        </Button> */}

      </Box>
      <Box display='flex' justifyContent='space-between'>
        <Typography
          color='secondary'
          variant='subtitle1'
        >
          {hasPassedDeadline ? 'Finished on {date}' : remainingTime}
        </Typography>
        <VoteStatusChip size='small' status={hasPassedDeadline ? 'Passed' : 'InProgress'} />
      </Box>

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
    </VotesWrapper>
  );
}
