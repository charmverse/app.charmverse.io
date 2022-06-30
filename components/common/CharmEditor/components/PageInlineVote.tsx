import styled from '@emotion/styled';
import { Box, Button, Chip, Divider, FormLabel, List, ListItem, Radio, Typography } from '@mui/material';
import { Vote, VoteStatus } from '@prisma/client';
import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import UserDisplay from 'components/common/UserDisplay';
import { useInlineVotes } from 'hooks/useInlineVotes';
import { useUser } from 'hooks/useUser';
import { VoteWithUsers } from 'lib/inline-votes/interfaces';
import { DateTime } from 'luxon';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { useMemo, useState } from 'react';
import InlineCharmEditor from '../InlineCharmEditor';

interface PageInlineVoteProps {
  inlineVote: VoteWithUsers
  detailed?: boolean
}

const VoteStatusLabelRecord: Record<VoteStatus, string> = {
  Cancelled: 'Cancelled',
  InProgress: 'In progress',
  Passed: 'Passed',
  Rejected: 'rejected'
};

const StyledDiv = styled.div<{detailed: boolean}>`
  background-color: ${({ theme }) => theme.palette.background.light};
  padding: ${({ theme, detailed }) => detailed ? 0 : theme.spacing(2)};
`;

function PageInlineVoteOption ({ isDisabled, option, voteId, checked, percentage }: {voteId: string, option: VoteWithUsers['options'][0], percentage: number, checked: boolean, isDisabled: boolean}) {
  const { castVote } = useInlineVotes();
  return (
    <>
      <ListItem sx={{ p: 0, justifyContent: 'space-between' }}>
        <Box display='flex' alignItems='center'>
          <Radio
            disabled={isDisabled}
            disableRipple
            size='small'
            checked={checked}
            onChange={() => {
              castVote(voteId, option.name);
            }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormLabel disabled={isDisabled}>{option.name}</FormLabel>
          </Box>
        </Box>
        <Typography variant='subtitle1' color='secondary'>{percentage.toFixed(2)}%</Typography>
      </ListItem>
      <Divider />
    </>
  );
}

export default function PageInlineVote ({ detailed = false, inlineVote }: PageInlineVoteProps) {
  const { deadline, description, title, userVotes, options, id } = inlineVote;
  const [showingDescription, setShowingDescription] = useState(false);
  const totalVotes = userVotes.length;
  const [user] = useUser();
  const { cancelVote, deleteVote } = useInlineVotes();
  const voteFrequencyRecord: Record<string, number> = useMemo(() => {
    return userVotes.reduce<Record<string, number>>((currentRecord, userVote) => {
      if (!currentRecord[userVote.choice]) {
        currentRecord[userVote.choice] = 1;
      }
      else {
        currentRecord[userVote.choice] += 1;
      }
      return currentRecord;
    }, {});
  }, [inlineVote]);

  const inlineVoteDetailModal = usePopupState({ variant: 'popover', popupId: 'inline-votes-detail' });

  const voteCountLabel = (
    <Box sx={{
      fontWeight: 'bold',
      fontSize: 20,
      mt: 1
    }}
    >
      <span>Votes</span> <Chip size='small' label={totalVotes} />
    </Box>
  );

  const userVote = user && inlineVote.userVotes.find(_userVote => _userVote.userId === user.id);

  const hasPassedDeadline = deadline.getTime() < Date.now();
  const relativeDate = DateTime.fromJSDate(new Date(deadline)).toRelative({ base: (DateTime.now()) });

  const popupState = usePopupState({ variant: 'popover', popupId: 'delete-inline-vote' });
  const menuState = bindMenu(popupState);

  return (
    <StyledDiv detailed={detailed}>
      <Typography variant='h6' fontWeight='bold'>
        {title}
      </Typography>
      <Box display='flex' justifyContent='space-between'>
        <Typography
          color='secondary'
          variant='subtitle1'
        >
          {hasPassedDeadline ? relativeDate : `${relativeDate?.replace('in', '')} left`}
        </Typography>
        <Chip size='small' label={VoteStatusLabelRecord[inlineVote.status]} />
      </Box>
      <Box mt={1} display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h6' fontWeight='bold'>
          Description
        </Typography>
        <Button size='small' variant='outlined' onClick={() => setShowingDescription((_showingDescription) => !_showingDescription)}>{!showingDescription ? 'Show' : 'Hide'}</Button>
      </Box>
      {showingDescription && (
        <InlineCharmEditor
          key={id}
          content={description}
          readOnly={true}
          style={{
            padding: 0
          }}
        />
      )}
      {!detailed && voteCountLabel}
      <List sx={{
        display: 'flex',
        gap: 0.5,
        flexDirection: 'column',
        my: 1
      }}
      >
        {options.map((option) => {
          const isDisabled = inlineVote.status !== 'InProgress' || inlineVote.deadline.getTime() < Date.now();
          return (
            <PageInlineVoteOption
              key={option.name}
              checked={option.name === userVote?.choice}
              isDisabled={isDisabled}
              option={option}
              percentage={(((voteFrequencyRecord[option.name] ?? 0) / totalVotes) * 100)}
              voteId={inlineVote.id}
            />
          );
        })}
      </List>
      <Box display='flex' justifyContent='space-between'>
        {!detailed && <Button variant='outlined' onClick={inlineVoteDetailModal.open}>View details</Button>}
        {user?.id === inlineVote.initiatorId && (
        <Box display='flex' gap={1}>
          {inlineVote.status === 'InProgress' && <Button onClick={() => cancelVote(inlineVote.id)} variant='outlined' color='secondary'>Cancel</Button>}
          <Button onClick={() => popupState.open()} variant='outlined' color='error'>Delete</Button>
        </Box>
        )}
      </Box>
      {detailed && voteCountLabel}
      {detailed && (
        <List>
          {userVotes.map(_userVote => (
            <>
              <ListItem sx={{
                px: 0,
                display: 'flex',
                justifyContent: 'space-between'
              }}
              >
                <UserDisplay user={_userVote.user as any} />
                <Typography variant='subtitle1' color='secondary'>{_userVote.choice}</Typography>
              </ListItem>
              <Divider />
            </>
          ))}
        </List>
      )}
      <Modal title='Vote details' size='large' open={inlineVoteDetailModal.isOpen} onClose={inlineVoteDetailModal.close}>
        <PageInlineVote inlineVote={inlineVote} detailed />
      </Modal>
      <ConfirmDeleteModal
        title='Delete vote'
        onClose={popupState.close}
        open={menuState.open}
        buttonText={`Delete ${inlineVote.title}`}
        onConfirm={() => deleteVote(inlineVote.id)}
        question={`Are you sure you want to delete ${inlineVote.title} vote?`}
      />
    </StyledDiv>
  );
}
