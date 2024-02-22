import type { VoteContext, VoteStatus } from '@charmverse/core/prisma';
import DateRangeIcon from '@mui/icons-material/DateRange';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { bindMenu, bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import type { RefObject } from 'react';

import ConfirmDeadlinePopover from 'components/common/CharmEditor/components/inlineVote/components/ConfirmDeadlinePopover';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useUser } from 'hooks/useUser';

interface VoteActionsProps {
  anchorRef: RefObject<HTMLElement>;
  deleteVote?: (voteId: string) => Promise<void>;
  cancelVote?: (voteId: string) => Promise<void>;
  isProposalVote: boolean;
  removeFromPage?: (voteId: string) => void;
  updateDeadline?: (voteId: string, deadline: Date) => Promise<void>;
  vote: { createdBy: string; id: string; deadline?: Date; status: VoteStatus; title: string; context: VoteContext };
}

export function VoteActionsMenu({
  anchorRef,
  cancelVote,
  deleteVote,
  removeFromPage,
  updateDeadline,
  vote,
  isProposalVote
}: VoteActionsProps) {
  const { user } = useUser();
  const actionsPopup = usePopupState({ variant: 'popover', popupId: 'inline-votes-action' });
  const deletePopup = usePopupState({ variant: 'popover', popupId: 'delete-inline-vote' });
  const deadlinePopup = usePopupState({ variant: 'popover', popupId: 'deadline-inline-vote' });
  const hasPassedDeadline = Boolean(vote.deadline && new Date(vote.deadline) <= new Date());

  const deleteQuestion = vote.title ? (
    <>
      <p>Are you sure you want to delete this vote:</p>
      <strong>{vote.title}</strong>?
    </>
  ) : (
    // most likely a proposal vote
    <p>Are you sure you want to remove the vote from this proposal?</p>
  );

  return vote.context === 'inline' || vote.status === 'InProgress' ? (
    <>
      <Box position='relative'>
        {vote.deadline && updateDeadline && (
          <ConfirmDeadlinePopover
            initialDeadline={vote.deadline}
            updateDeadline={async (deadline: Date) => {
              deadlinePopup.setOpen(false);
              await updateDeadline(vote.id, deadline);
            }}
            {...bindPopover(deadlinePopup)}
          />
        )}
      </Box>
      {vote.createdBy === user?.id && (
        <IconButton size='small' onClick={actionsPopup.open}>
          <MoreHorizIcon fontSize='small' />
        </IconButton>
      )}
      <ConfirmDeleteModal
        title={isProposalVote ? 'Delete vote' : 'Delete poll'}
        onClose={deletePopup.close}
        open={deletePopup.isOpen}
        buttonText='Delete'
        onConfirm={() => {
          removeFromPage?.(vote.id);
          deleteVote?.(vote.id);
        }}
        question={deleteQuestion}
      />
      <Menu
        {...bindMenu(actionsPopup)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClick={(e) => {
          e.stopPropagation();
          actionsPopup.close();
        }}
      >
        {vote.status === 'InProgress' && !hasPassedDeadline && cancelVote && (
          <MenuItem
            dense
            onClick={() => {
              removeFromPage?.(vote.id);
              cancelVote(vote.id);
            }}
          >
            <DoNotDisturbIcon fontSize='small' sx={{ mr: 1 }} />
            <ListItemText>{isProposalVote ? 'Cancel vote' : 'Cancel poll'}</ListItemText>
          </MenuItem>
        )}
        {deleteVote && vote.context === 'inline' && (
          <MenuItem dense onClick={deletePopup.open}>
            <DeleteOutlineIcon fontSize='small' sx={{ mr: 1 }} />
            <ListItemText>{isProposalVote ? 'Delete vote' : 'Delete poll'}</ListItemText>
          </MenuItem>
        )}
        {vote.status === 'InProgress' && vote.deadline && !hasPassedDeadline && updateDeadline && (
          <MenuItem dense onClick={() => deadlinePopup.open(anchorRef.current)}>
            <DateRangeIcon fontSize='small' sx={{ mr: 1 }} />
            <ListItemText>Change end date</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  ) : null;
}
