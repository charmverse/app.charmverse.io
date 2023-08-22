import { useEditorViewContext } from '@bangle.dev/react';
import type { UserVote } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Radio,
  RadioGroup,
  Typography
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { DateTime } from 'luxon';
import { usePopupState } from 'material-ui-popup-state/hooks';
import React from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import { CharmEditor } from 'components/common/CharmEditor';
import Modal from 'components/common/Modal';
import { useTasks } from 'components/nexus/hooks/useTasks';
import { VoteActionsMenu } from 'components/votes/components/VoteActionsMenu';
import VoteStatusChip from 'components/votes/components/VoteStatusChip';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { removeInlineVoteMark } from 'lib/prosemirror/plugins/inlineVotes/removeInlineVoteMark';
import type { ExtendedVote } from 'lib/votes/interfaces';
import { isVotingClosed } from 'lib/votes/utils';

import { VotesWrapper } from './VotesWrapper';

export interface VoteDetailProps {
  vote: ExtendedVote;
  detailed?: boolean;
  isProposal?: boolean;
  castVote: (voteId: string, choice: string) => Promise<UserVote>;
  deleteVote: (voteId: string) => Promise<void>;
  cancelVote: (voteId: string) => Promise<void>;
  updateDeadline: (voteId: string, deadline: Date) => Promise<void>;
  disableVote?: boolean;
}

const StyledFormControl = styled(FormControl)`
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

export function VoteDetail({
  cancelVote,
  castVote,
  deleteVote,
  updateDeadline,
  detailed = false,
  vote,
  isProposal,
  disableVote
}: VoteDetailProps) {
  const { deadline, totalVotes, content, id, title, userChoice, voteOptions, aggregatedResult } = vote;
  const { user } = useUser();
  const view = useEditorViewContext();
  const { data: userVotes, mutate } = useSWR(detailed ? `/votes/${id}/user-votes` : null, () =>
    charmClient.votes.getUserVotes(id)
  );
  const { mutate: refetchTasks } = useTasks();
  const { getMemberById } = useMembers();

  const voteDetailsPopup = usePopupState({ variant: 'popover', popupId: 'inline-votes-detail' });

  const voteCountLabel = (
    <Box
      sx={{
        fontWeight: 'bold',
        mt: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      <span>Votes</span> <Chip size='small' label={totalVotes} />
    </Box>
  );

  const hasPassedDeadline = new Date(deadline) < new Date();
  const userVoteChoice =
    userVotes && user ? userVotes.find((userVote) => userVote.userId === user.id)?.choice ?? userChoice : userChoice;

  const relativeDate = DateTime.fromJSDate(new Date(deadline)).toRelative({ base: DateTime.now() });

  function removeFromPage(voteId: string) {
    if (view) {
      removeInlineVoteMark(view, voteId);
    }
  }

  return (
    <VotesWrapper detailed={detailed} id={`vote.${vote.id}`}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h6' fontWeight='bold' component='span'>
          {!isProposal ? title : 'Poll on this proposal'}
        </Typography>
        <VoteActionsMenu
          deleteVote={deleteVote}
          cancelVote={cancelVote}
          isProposalVote={!!isProposal}
          vote={vote}
          removeFromPage={removeFromPage}
          updateDeadline={updateDeadline}
        />
      </Box>
      <Box display='flex' justifyContent='space-between'>
        <Typography style={{ margin: 0 }} color='secondary' variant='subtitle1' my={0} component='span'>
          {hasPassedDeadline ? relativeDate : `${relativeDate?.replace(/^in/g, '')} left`}
        </Typography>
        <VoteStatusChip size='small' status={hasPassedDeadline && isProposal ? 'Complete' : vote.status} />
      </Box>
      {content && (
        <Box my={1} mb={2}>
          <CharmEditor disablePageSpecificFeatures isContentControlled content={content as PageContent} readOnly />
        </Box>
      )}
      {!detailed && voteCountLabel}
      <Tooltip
        placement='top-start'
        title={disableVote ? 'You do not have the permissions to participate in this vote' : ''}
      >
        <StyledFormControl>
          <RadioGroup name={vote.id} value={userVoteChoice}>
            {voteOptions.map((voteOption) => (
              <FormControlLabel
                key={voteOption.name}
                control={<Radio size='small' />}
                disabled={isVotingClosed(vote) || !user || !!disableVote}
                value={voteOption.name}
                label={
                  <Box display='flex' justifyContent='space-between' flexGrow={1}>
                    <span>{voteOption.name}</span>
                    <Typography variant='subtitle1' color='secondary' component='span'>
                      {((totalVotes === 0 ? 0 : (aggregatedResult?.[voteOption.name] ?? 0) / totalVotes) * 100).toFixed(
                        2
                      )}
                      %
                    </Typography>
                  </Box>
                }
                disableTypography
                onChange={async () => {
                  if (user) {
                    const userVote = await castVote(id, voteOption.name);
                    refetchTasks();
                    mutate(
                      (_userVotes) => {
                        if (_userVotes) {
                          const existingUserVoteIndex = _userVotes.findIndex(
                            (_userVote) => _userVote.userId === user.id
                          );
                          // User already voted
                          if (existingUserVoteIndex !== -1) {
                            _userVotes.splice(existingUserVoteIndex, 1);
                          }

                          return [
                            {
                              ...userVote,
                              user
                            },
                            ..._userVotes
                          ];
                        }
                        return undefined;
                      },
                      {
                        revalidate: false
                      }
                    );
                  }
                }}
              />
            ))}
          </RadioGroup>
        </StyledFormControl>
      </Tooltip>
      {!detailed && (
        <Box display='flex' justifyContent='flex-end'>
          <Button
            data-test='view-poll-details-button'
            color='secondary'
            variant='outlined'
            size='small'
            onClick={voteDetailsPopup.open}
          >
            View details
          </Button>
        </Box>
      )}
      {detailed &&
        (totalVotes !== 0 ? (
          voteCountLabel
        ) : (
          <Card variant='outlined'>
            <Box p={3} textAlign='center'>
              <HowToVoteOutlinedIcon fontSize='large' color='secondary' />
              <Typography color='secondary'>No votes casted yet. Be the first to vote !!!</Typography>
            </Box>
          </Card>
        ))}
      {detailed && userVotes && (
        <List>
          {userVotes.map((userVote) => {
            const member = getMemberById(userVote.user.id);
            const choices = userVote.choice ? [userVote.choice] : userVote.choices;

            if (!choices.length) {
              return null;
            }

            return (
              <React.Fragment key={userVote.userId}>
                <ListItem
                  dense
                  sx={{
                    px: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 1
                  }}
                >
                  <Avatar avatar={userVote.user.avatar} name={member?.username ?? userVote.user.username} />
                  <ListItemText
                    primary={<Typography>{member?.username ?? userVote.user.username}</Typography>}
                    secondary={
                      <Typography variant='subtitle1' color='secondary'>
                        {DateTime.fromJSDate(new Date(userVote.updatedAt)).toRelative({ base: DateTime.now() })}
                      </Typography>
                    }
                  />
                  <Typography fontWeight={500} color='secondary'>
                    {choices.join(', ')}
                  </Typography>
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
        </List>
      )}
      <Modal title='Poll details' size='large' open={voteDetailsPopup.isOpen} onClose={voteDetailsPopup.close}>
        <VoteDetail
          vote={vote}
          detailed={true}
          cancelVote={cancelVote}
          castVote={castVote}
          deleteVote={deleteVote}
          updateDeadline={updateDeadline}
        />
      </Modal>
    </VotesWrapper>
  );
}
