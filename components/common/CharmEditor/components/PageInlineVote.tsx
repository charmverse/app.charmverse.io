import styled from '@emotion/styled';
import { Box, Button, Chip, Divider, FormLabel, IconButton, List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Radio, Typography } from '@mui/material';
import { Vote, VoteStatus } from '@prisma/client';
import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import UserDisplay from 'components/common/UserDisplay';
import { useInlineVotes } from 'hooks/useInlineVotes';
import { useUser } from 'hooks/useUser';
import { VoteWithUsers } from 'lib/inline-votes/interfaces';
import { DateTime } from 'luxon';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { useMemo } from 'react';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Avatar from 'components/common/Avatar';
import { useEditorViewContext } from '@bangle.dev/react';
import { removeInlineVoteMark } from 'lib/inline-votes/removeInlineVoteMark';

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

const MAX_DESCRIPTION_LENGTH = 200;

export default function PageInlineVote ({ detailed = false, inlineVote }: PageInlineVoteProps) {
  const { deadline, description, title, userVotes, options } = inlineVote;
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
  const inlineVoteActionModal = usePopupState({ variant: 'popover', popupId: 'inline-votes-action' });

  const voteCountLabel = (
    <Box sx={{
      fontWeight: 'bold',
      fontSize: 18,
      mt: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 0.5
    }}
    >
      <span>Votes</span> <Chip size='small' label={totalVotes} />
    </Box>
  );

  const userVote = user && inlineVote.userVotes.find(_userVote => _userVote.userId === user.id);

  const hasPassedDeadline = deadline.getTime() < Date.now();
  const relativeDate = DateTime.fromJSDate(new Date(deadline)).toRelative({ base: (DateTime.now()) });
  const isDescriptionAbove = description.length > MAX_DESCRIPTION_LENGTH;
  const popupState = usePopupState({ variant: 'popover', popupId: 'delete-inline-vote' });
  const menuState = bindMenu(popupState);
  const view = useEditorViewContext();

  return (
    <StyledDiv detailed={detailed} id={`vote.${inlineVote.id}`}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h6' fontWeight='bold'>
          {title}
        </Typography>
        <Chip size='small' label={VoteStatusLabelRecord[inlineVote.status]} />
      </Box>
      <Box display='flex' justifyContent='space-between'>
        <Typography
          color='secondary'
          variant='subtitle1'
        >
          {hasPassedDeadline ? relativeDate : `${relativeDate?.replace('in', '')} left`}
        </Typography>
        {inlineVote.initiatorId === user?.id && (
        <IconButton size='small' onClick={inlineVoteActionModal.open}>
          <MoreHorizIcon fontSize='small' />
        </IconButton>
        )}
      </Box>
      <Box my={1} mb={2}>{isDescriptionAbove && !detailed ? (
        <span>
          {description.slice(0, 200)}...
          <Typography
            component='span'
            onClick={inlineVoteDetailModal.open}
            sx={{
              ml: 0.5,
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
            variant='subtitle1'
            fontWeight='bold'
          >(More)
          </Typography>
        </span>
      ) : description}
      </Box>
      {!detailed && voteCountLabel}
      <List sx={{
        display: 'flex',
        gap: 0.5,
        flexDirection: 'column'
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
              percentage={((totalVotes === 0 ? 0 : (voteFrequencyRecord[option.name] ?? 0) / totalVotes) * 100)}
              voteId={inlineVote.id}
            />
          );
        })}
      </List>
      {!detailed && <Button variant='outlined' onClick={inlineVoteDetailModal.open}>View details</Button>}
      {detailed && voteCountLabel}
      {detailed && (
        <List>
          {userVotes.map(_userVote => (
            <>
              <ListItem
                dense
                sx={{
                  px: 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 1
                }}
              >
                <Avatar avatar={_userVote.user.avatar} name={_userVote.user.username} />
                <ListItemText
                  primary={<Typography>{_userVote.user.username}</Typography>}
                  secondary={<Typography variant='subtitle1' color='secondary'>{DateTime.fromJSDate(new Date(_userVote.updatedAt)).toRelative({ base: (DateTime.now()) })}</Typography>}
                />
                <Typography fontWeight={500} color='secondary'>{_userVote.choice}</Typography>
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
        onConfirm={() => {
          removeInlineVoteMark(view, inlineVote.id);
          deleteVote(inlineVote.id);
        }}
        question={`Are you sure you want to delete ${inlineVote.title} vote?`}
      />
      <Menu
        {...bindMenu(inlineVoteActionModal)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClick={(e) => e.stopPropagation()}
      >
        {inlineVote.status === 'InProgress' && (
        <MenuItem
          dense
          onClick={() => {
            removeInlineVoteMark(view, inlineVote.id);
            cancelVote(inlineVote.id);
          }}
        >
          <DoNotDisturbIcon fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Cancel</ListItemText>
        </MenuItem>
        )}
        <MenuItem dense onClick={() => popupState.open()}>
          <DeleteOutlineIcon fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </StyledDiv>
  );
}
