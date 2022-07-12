import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import { Box, Button, Card, Chip, Divider, FormControl, FormControlLabel, List, ListItem, ListItemText, Radio, RadioGroup, Typography } from '@mui/material';
import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import Modal from 'components/common/Modal';
import VoteStatusChip from 'components/votes/components/VoteStatusChip';
import { useUser } from 'hooks/useUser';
import { useVotes } from 'hooks/useVotes';
import { removeInlineVoteMark } from 'lib/inline-votes/removeInlineVoteMark';
import { ExtendedVote } from 'lib/votes/interfaces';
import { isVotingClosed } from 'lib/votes/utils';
import { DateTime } from 'luxon';
import { usePopupState } from 'material-ui-popup-state/hooks';
import useSWR from 'swr';
import VoteActionsMenu from 'components/votes/components/VoteActionsMenu';

interface PageInlineVoteProps {
  inlineVote: ExtendedVote;
  detailed?: boolean;
  isProposal?: boolean;
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

export default function PageInlineVote ({ detailed = false, inlineVote: vote, isProposal }: PageInlineVoteProps) {
  const { deadline, totalVotes, description, id, title, userChoice, voteOptions } = vote;
  const { castVote, cancelVote, deleteVote } = useVotes();
  const [user] = useUser();
  const view = useEditorViewContext();
  const { data: userVotes, mutate } = useSWR(detailed ? `/votes/${id}/user-votes` : null, () => charmClient.getUserVotes(id));

  const voteAggregateResult = vote.aggregatedResult;

  const voteDetailsPopup = usePopupState({ variant: 'popover', popupId: 'inline-votes-detail' });

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

  function removeFromPage (voteId: string) {
    if (view) {
      removeInlineVoteMark(view, voteId);
    }
  }

  return (
    <StyledDiv detailed={detailed} id={`vote.${vote.id}`}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h6' fontWeight='bold'>
          {!isProposal ? title : 'Vote on this proposal'}
        </Typography>
        <VoteActionsMenu deleteVote={deleteVote} cancelVote={cancelVote} vote={vote} removeFromPage={removeFromPage} />
      </Box>
      <Box display='flex' justifyContent='space-between'>
        <Typography
          color='secondary'
          variant='subtitle1'
        >
          {hasPassedDeadline ? relativeDate : `${relativeDate?.replace(/^in/g, '')} left`}
        </Typography>
        <VoteStatusChip size='small' status={vote.status} />
      </Box>
      {description && (
        <Box my={1} mb={2}>{isDescriptionAbove && !detailed ? (
          <span>
            {description.slice(0, 200)}...
            <Typography
              component='span'
              onClick={voteDetailsPopup.open}
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
        <RadioGroup name={vote.id} value={userChoice}>
          {voteOptions.map(voteOption => (
            <FormControlLabel
              control={<Radio size='small' />}
              disabled={isVotingClosed(vote) || !user}
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
      {!detailed && (
        <Box display='flex' justifyContent='flex-end'>
          <Button disabled={!user} color='secondary' variant='outlined' size='small' onClick={voteDetailsPopup.open}>View details</Button>
        </Box>
      )}
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
      <Modal title='Vote details' size='large' open={voteDetailsPopup.isOpen} onClose={voteDetailsPopup.close}>
        <PageInlineVote
          inlineVote={vote}
          detailed={true}
        />
      </Modal>
    </StyledDiv>
  );
}
