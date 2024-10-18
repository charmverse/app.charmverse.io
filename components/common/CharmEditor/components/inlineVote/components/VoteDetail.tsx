import type { UserVote } from '@charmverse/core/prisma';
import { VoteType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  FormControl,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { getChainById } from '@root/connectors/chains';
import { DateTime } from 'luxon';
import { usePopupState } from 'material-ui-popup-state/hooks';
import millify from 'millify';
import type { EditorView } from 'prosemirror-view';
import React, { useRef } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import { CharmEditor } from 'components/common/CharmEditor';
import { MultiChoiceForm } from 'components/common/CharmEditor/components/inlineVote/components/MultiChoiceForm';
import { SingleChoiceForm } from 'components/common/CharmEditor/components/inlineVote/components/SingleChoiceForm';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import { TokenBadge } from 'components/common/TokenBadge';
import { useNotifications } from 'components/nexus/hooks/useNotifications';
import { VoteActionsMenu } from 'components/votes/components/VoteActionsMenu';
import VoteStatusChip from 'components/votes/components/VoteStatusChip';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { removeInlineVoteMark } from 'lib/prosemirror/plugins/inlineVotes/removeInlineVoteMark';
import type { ExtendedVote } from 'lib/votes/interfaces';
import { isVotingClosed } from 'lib/votes/utils';

import { VotesWrapper } from './VotesWrapper';

export interface VoteDetailProps {
  vote: ExtendedVote;
  detailed?: boolean;
  isProposal?: boolean;
  castVote: (voteId: string, choices: string[]) => Promise<UserVote | void>;
  deleteVote?: (voteId: string) => Promise<void>;
  cancelVote?: (voteId: string) => Promise<void>;
  updateDeadline: (voteId: string, deadline: Date) => Promise<void>;
  disableVote?: boolean;
  view: EditorView | null;
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
  disableVote,
  view
}: VoteDetailProps) {
  const { deadline, totalVotes, content, id, title, userChoice, voteOptions, aggregatedResult, type, maxChoices } =
    vote;
  const { user } = useUser();
  const anchorRef = useRef<HTMLElement>(null);
  const { data: userVotes, mutate } = useSWR(detailed ? `/votes/${id}/user-votes` : null, () =>
    charmClient.votes.getUserVotes(id)
  );
  const { mutate: refetchNotifications } = useNotifications();
  const { getMemberById } = useMembers();
  const showPageContent = content && !checkIsContentEmpty(content as PageContent);

  const voteDetailsPopup = usePopupState({ variant: 'popover', popupId: 'inline-votes-detail' });

  const voteCountLabel = (
    <Box
      sx={{
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      <span>Votes</span> <Chip size='small' label={totalVotes < 1 ? totalVotes : millify(totalVotes)} />
    </Box>
  );

  const hasPassedDeadline = new Date(deadline) < new Date();
  const userVoteChoice =
    userVotes && user ? (userVotes.find((userVote) => userVote.userId === user.id)?.choices ?? userChoice) : userChoice;

  const relativeDate = DateTime.fromJSDate(new Date(deadline)).toRelative({ base: DateTime.now() });

  const onVoteChange = async (v: string | string[]) => {
    if (!user) {
      return;
    }
    const choiceArray = typeof v === 'string' ? [v] : v;
    const userVote = await castVote(id, choiceArray);
    refetchNotifications();
    if (userVote) {
      mutate(
        (_userVotes) => {
          if (_userVotes) {
            const existingUserVoteIndex = _userVotes.findIndex((_userVote) => _userVote.userId === user.id);
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
  };

  function removeFromPage(voteId: string) {
    if (view) {
      removeInlineVoteMark(view, voteId);
    }
  }

  const [blockExplorerUrl] =
    (vote.strategy === 'token' && vote.chainId ? getChainById(vote.chainId)?.blockExplorerUrls : []) ?? [];

  const chain = vote.chainId ? getChainById(vote.chainId) : null;

  return (
    <VotesWrapper data-test='vote-container' detailed={detailed} id={`vote.${vote.id}`}>
      <Box ref={anchorRef} display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h6' fontWeight='bold' component='span'>
          {title || 'Poll on this proposal'}
        </Typography>
        <VoteActionsMenu
          anchorRef={anchorRef}
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
      {showPageContent && (
        <Box my={1} mb={2}>
          <CharmEditor disablePageSpecificFeatures isContentControlled content={content as PageContent} readOnly />
        </Box>
      )}
      <Stack flexDirection='row' mt={1} justifyContent='space-between' alignItems='center'>
        {!detailed && voteCountLabel}
      </Stack>
      {vote.strategy === 'token' && vote.blockNumber && chain && blockExplorerUrl ? (
        <Stack flexDirection='row' justifyContent='space-between' mt={1}>
          <TokenBadge chainId={vote.chainId!} tokenAddress={vote.tokenAddress!} />
          <Link href={`${blockExplorerUrl}/block/${vote.blockNumber}`} target='_blank' rel='noreferrer'>
            <Tooltip title={`View block on ${chain.chainName} explorer`}>
              <Stack flexDirection='row' alignItems='center' gap={0.5}>
                <Typography style={{ margin: 0 }} color='secondary' variant='subtitle1' my={0} component='span'>
                  {vote.blockNumber}
                </Typography>
                <OpenInNewIcon
                  color='secondary'
                  sx={{
                    fontSize: 16
                  }}
                />
              </Stack>
            </Tooltip>
          </Link>
        </Stack>
      ) : null}
      <Tooltip
        placement='top-start'
        title={disableVote ? 'You do not have the permissions to participate in this vote' : ''}
      >
        <StyledFormControl>
          {(type === VoteType.Approval || type === VoteType.SingleChoice) && (
            <SingleChoiceForm
              value={userVoteChoice?.[0]}
              voteOptions={voteOptions}
              disabled={vote.votingPower === 0 || isVotingClosed(vote) || !user || !!disableVote}
              totalVotes={totalVotes}
              aggregatedResult={aggregatedResult}
              onChange={onVoteChange}
              showAggregateResult={vote.strategy === 'token'}
            />
          )}

          {type === VoteType.MultiChoice && (
            <MultiChoiceForm
              value={userVoteChoice}
              voteOptions={voteOptions}
              disabled={vote.votingPower === 0 || isVotingClosed(vote) || !user || !!disableVote}
              totalVotes={totalVotes}
              aggregatedResult={aggregatedResult}
              onChange={onVoteChange}
              maxChoices={maxChoices}
              hasPassedDeadline={hasPassedDeadline}
              showAggregateResult={vote.strategy === 'token'}
            />
          )}
        </StyledFormControl>
      </Tooltip>
      {!detailed && (
        <Box
          alignItems='center'
          display='flex'
          justifyContent={vote.strategy === 'token' ? 'space-between' : 'flex-end'}
        >
          {vote.strategy === 'token' && (
            <Stack gap={0.5}>
              <Typography variant='subtitle1'>
                Your voting power: {vote.votingPower < 1 ? vote.votingPower : millify(vote.votingPower)}
              </Typography>
              <Typography variant='subtitle1'>
                Total voting power: {vote.totalVotingPower ? millify(vote.totalVotingPower) : 'N/A'}
              </Typography>
            </Stack>
          )}
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
            const choices = userVote.choices;

            if (!choices.length) {
              return null;
            }

            const userVotePower = userVote.tokenAmount ? parseFloat(userVote.tokenAmount) : null;

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
                    {userVotePower ? ` (${userVotePower < 1 ? userVotePower : millify(userVotePower)})` : ''}
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
          view={view}
        />
      </Modal>
    </VotesWrapper>
  );
}
