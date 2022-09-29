import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton, ListItemText, Menu, MenuItem } from '@mui/material';
import useTasks from 'components/nexus/hooks/useTasks';
import { useUser } from 'hooks/useUser';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';

interface VoteActionsProps {
  deleteProposal: (voteId: string) => Promise<void>;
  editProposal: (voteId: string) => void;
  proposal: ProposalWithUsers;
}

export default function ProposalActionsMenu ({ deleteProposal, editProposal, proposal }: VoteActionsProps) {
  const { user } = useUser();
  const actionsPopup = usePopupState({ variant: 'popover', popupId: 'proposal-action' });
  const { mutate: refetchTasks } = useTasks();
  return (
    <>
      {proposal.authors.some(author => author.userId === user?.id) && (
        <IconButton size='small' onClick={actionsPopup.open}>
          <MoreHorizIcon fontSize='small' />
        </IconButton>
      )}
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
              editProposal(proposal.id);
            }}
          >
            <EditIcon fontSize='small' sx={{ mr: 1 }} />
            <ListItemText>Edit proposal</ListItemText>
          </MenuItem>
        )}
        {deleteProposal && (
          <MenuItem
            dense
            onClick={async () => {
              deleteProposal(proposal.id);
              refetchTasks();
            }}
          >
            <DeleteOutlineIcon fontSize='small' sx={{ mr: 1 }} />
            <ListItemText>Delete proposal</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
