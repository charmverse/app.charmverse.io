import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, Button, Card, Chip, Divider, FormControl, FormControlLabel, IconButton, List, ListItem, ListItemText, Menu, MenuItem, Radio, RadioGroup, Typography } from '@mui/material';
import { VoteOptions } from '@prisma/client';
import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import VoteStatusChip from 'components/votes/components/VoteStatusChip';
import { useInlineVotes } from 'hooks/useInlineVotes';
import { useUser } from 'hooks/useUser';
import { removeInlineVoteMark } from 'lib/inline-votes/removeInlineVoteMark';
import { ExtendedVote } from 'lib/votes/interfaces';
import { isVotingClosed } from 'lib/votes/utils';
import { DateTime } from 'luxon';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { Fragment } from 'react';
import useSWR from 'swr';

interface PageInlineVoteProps {
  inlineVote: ExtendedVote
  detailed?: boolean
}

const StyledDiv = styled.div<{ detailed: boolean }>`
  background-color: ${({ theme, detailed }) => detailed && theme.palette.mode !== 'light' ? theme.palette.background.default : theme.palette.background.light};
  padding: ${({ theme }) => theme.spacing(2)};
`;

const StyledFormControl = styled(FormControl)`
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const MAX_DESCRIPTION_LENGTH = 200;

export default function PageInlineVote ({ detailed = false, inlineVote }: PageInlineVoteProps) {
  const { deadline, totalVotes, description, id, title, userChoice, voteOptions } = inlineVote;
  const [user] = useUser();
  const { castVote, cancelVote, deleteVote } = useInlineVotes();
  const { data: userVotes, mutate } = useSWR(detailed ? `/votes/${id}/user-votes` : null, () => charmClient.getUserVotes(id));

  const voteAggregateResult = inlineVote.aggregatedResult;

  const inlineVoteDetailModal = usePopupState({ variant: 'popover', popupId: 'inline-votes-detail' });
  const inlineVoteActionModal = usePopupState({ variant: 'popover', popupId: 'inline-votes-action' });

  const voteCountLabel = (
    <Box sx={{
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

  const relativeDate = DateTime.fromJSDate(new Date(deadline)).toRelative({ base: (DateTime.now()) });
  const isDescriptionAbove = description ? description.length > MAX_DESCRIPTION_LENGTH : false;
  const popupState = usePopupState({ variant: 'popover', popupId: 'delete-inline-vote' });
  const menuState = bindMenu(popupState);
  const view = useEditorViewContext();

  return (
    <StyledDiv detailed={detailed} id={`vote.${inlineVote.id}`}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h6' fontWeight='bold'>
          {title}
        </Typography>
        {inlineVote.createdBy === user?.id && (
          <IconButton size='small' onClick={inlineVoteActionModal.open}>
            <MoreHorizIcon fontSize='small' />
          </IconButton>
        )}
      </Box>
      <Box display='flex' justifyContent='space-between'>
        <Typography
          color='secondary'
          variant='subtitle1'
        >
          {hasPassedDeadline ? relativeDate : `${relativeDate?.replace(/^in/g, '')} left`}
        </Typography>
        <VoteStatusChip size='small' status={inlineVote.status} />
      </Box>
      {description && (
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
      )}
      {!detailed && voteCountLabel}
      <StyledFormControl>
        <RadioGroup name={inlineVote.id} value={userChoice}>
          {voteOptions.map(voteOption => (
            <FormControlLabel
              control={<Radio size='small' />}
              disabled={isVotingClosed(inlineVote) || !user}
              value={voteOption.name}
              label={(
                <Box display='flex' justifyContent='space-between' flexGrow={1}>
                  <span>{voteOption.name}</span>
                  <Typography variant='subtitle1' color='secondary'>{((totalVotes === 0 ? 0 : (voteAggregateResult?.[voteOption.name] ?? 0) / totalVotes) * 100).toFixed(2)}%</Typography>
                </Box>
              )}
              disableTypography
              onChange={async () => {
                if (user) {
                  const userVote = await castVote(id, voteOption.name);
                  mutate((_userVotes) => {
                    if (_userVotes) {
                      const existingUserVoteIndex = _userVotes.findIndex(_userVote => _userVote.userId === user.id);
                      // User already voted
                      if (existingUserVoteIndex !== -1) {
                        _userVotes.splice(existingUserVoteIndex, 1);
                      }

                      return [{
                        ...userVote,
                        user
                      }, ..._userVotes];
                    }
                    return undefined;
                  }, {
                    revalidate: false
                  });
                }
              }}
            />
          ))}
        </RadioGroup>
      </StyledFormControl>
      {!detailed && <Button disabled={!user} variant='outlined' onClick={inlineVoteDetailModal.open}>View details</Button>}
      {detailed && (totalVotes !== 0 ? voteCountLabel : (
        <Card variant='outlined'>
          <Box p={3} textAlign='center'>
            <HowToVoteOutlinedIcon fontSize='large' color='secondary' />
            <Typography color='secondary'>No votes casted yet. Be the first to vote !!!</Typography>
          </Box>
        </Card>
      ))}
      {detailed && userVotes && (
        <List>
          {userVotes.map(userVote => (
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
                <Avatar avatar={userVote.user.avatar} name={userVote.user.username} />
                <ListItemText
                  primary={<Typography>{userVote.user.username}</Typography>}
                  secondary={<Typography variant='subtitle1' color='secondary'>{DateTime.fromJSDate(new Date(userVote.updatedAt)).toRelative({ base: (DateTime.now()) })}</Typography>}
                />
                <Typography fontWeight={500} color='secondary'>{userVote.choice}</Typography>
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
        question={`Are you sure you want to delete this vote: ${inlineVote.title}?`}
      />
      <Menu
        {...bindMenu(inlineVoteActionModal)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClick={(e) => e.stopPropagation()}
      >
        {inlineVote.status === 'InProgress' && !hasPassedDeadline && (
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
