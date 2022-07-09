import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import { IconButton, ListItemText, Menu, MenuItem } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EditIcon from '@mui/icons-material/Edit';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { useUser } from 'hooks/useUser';

interface VoteActionsProps {
  deleteVote: (voteId: string) => Promise<void>;
  cancelVote: (voteId: string) => Promise<void>;
  editProposal?: (voteId: string) => void;
  removeFromPage?: (voteId: string) => void;
  vote: { createdBy: string, id: string, deadline?: Date, status: string, title: string };
}

export default function VoteActionsMenu ({ cancelVote, deleteVote, editProposal, removeFromPage, vote }: VoteActionsProps) {

  const [user] = useUser();
  const actionsPopup = usePopupState({ variant: 'popover', popupId: 'inline-votes-action' });
  const popupState = usePopupState({ variant: 'popover', popupId: 'delete-inline-vote' });
  const hasPassedDeadline = Boolean(vote.deadline && new Date(vote.deadline) <= new Date());

  return (
    <>
      {vote.createdBy === user?.id && (
        <IconButton size='small' onClick={actionsPopup.open}>
          <MoreHorizIcon fontSize='small' />
        </IconButton>
      )}
      <ConfirmDeleteModal
        title='Delete vote'
        onClose={popupState.close}
        open={popupState.isOpen}
        buttonText='Delete'
        onConfirm={() => {
          removeFromPage?.(vote.id);
          deleteVote(vote.id);
        }}
        question={<><p>Are you sure you want to delete this vote:</p><strong>{vote.title}</strong>?</>}
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
        {editProposal && (
          <MenuItem
            dense
            onClick={() => {
              editProposal(vote.id);
            }}
          >
            <EditIcon fontSize='small' sx={{ mr: 1 }} />
            <ListItemText>Edit proposal</ListItemText>
          </MenuItem>
        )}
        {vote.status === 'InProgress' && !hasPassedDeadline && (
          <MenuItem
            dense
            onClick={() => {
              removeFromPage?.(vote.id);
              cancelVote(vote.id);
            }}
          >
            <DoNotDisturbIcon fontSize='small' sx={{ mr: 1 }} />
            <ListItemText>Cancel</ListItemText>
          </MenuItem>
        )}
        <MenuItem dense onClick={popupState.open}>
          <DeleteOutlineIcon fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
