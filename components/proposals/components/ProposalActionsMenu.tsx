import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton, ListItemText, MenuItem } from '@mui/material';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';

import { PageActions } from 'components/common/PageActions';
import useTasks from 'components/nexus/hooks/useTasks';
import useIsAdmin from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { ProposalWithUsers } from 'lib/proposal/interface';

interface ProposalActionsProps {
  deleteProposal: (voteId: string) => Promise<void>;
  editProposal: (voteId: string) => void;
  proposal: ProposalWithUsers;
  lastUpdatedAt: Date;
}

export default function ProposalActionsMenu ({ lastUpdatedAt, deleteProposal, editProposal, proposal }: ProposalActionsProps) {
  const { user } = useUser();
  const isAdmin = useIsAdmin();
  const actionsPopup = usePopupState({ variant: 'popover', popupId: 'proposal-action' });
  const { mutate: refetchTasks } = useTasks();
  const showContextMenu = isAdmin || proposal.authors.some(author => author.userId === user?.id);

  return (
    <>
      {showContextMenu && (
        <IconButton size='small' onClick={actionsPopup.open}>
          <MoreHorizIcon fontSize='small' />
        </IconButton>
      )}
      <PageActions
        {...bindMenu(actionsPopup)}
        pageType='proposal'
        pageCreatedBy={proposal.createdBy}
        pageId={proposal.id}
        pageUpdatedAt={lastUpdatedAt}
        onClick={actionsPopup.close}
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
      </PageActions>
    </>
  );
}
