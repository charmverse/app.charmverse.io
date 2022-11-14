import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import LaunchIcon from '@mui/icons-material/Launch';
import LinkIcon from '@mui/icons-material/Link';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Divider, IconButton, ListItemText, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';

import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import useTasks from 'components/nexus/hooks/useTasks';
import useIsAdmin from 'hooks/useIsAdmin';
import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { humanFriendlyDate } from 'lib/utilities/dates';

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
  const { showMessage } = useSnackbar();
  const { members } = useMembers();
  const pageCreator = members.find(member => member.id === proposal.createdBy);

  function onClickCopyLink () {
    let bountyLink = window.location.href;

    const queryString = new URLSearchParams(window.location.search);
    if (queryString.get('id') !== proposal.id) {
      const newUrl = new URL(window.location.toString());
      newUrl.searchParams.set('id', proposal.id);
      bountyLink = newUrl.toString();
    }

    Utils.copyTextToClipboard(bountyLink);
    showMessage('Copied proposal link to clipboard', 'success');
  }

  function onClickOpenInNewTab () {
    let bountyLink = window.location.href;

    const queryString = new URLSearchParams(window.location.search);
    if (queryString.get('id') !== proposal.id) {
      const newUrl = new URL(window.location.toString());
      newUrl.searchParams.set('id', proposal.id);
      bountyLink = newUrl.toString();
    }

    window.open(bountyLink);
  }

  return (
    <>
      {showContextMenu && (
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
        <MenuItem dense onClick={onClickCopyLink}>
          <LinkIcon fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Copy link</ListItemText>
        </MenuItem>
        <MenuItem dense onClick={onClickOpenInNewTab}>
          <LaunchIcon fontSize='small' sx={{ mr: 1 }} />
          <ListItemText>Open in new tab</ListItemText>
        </MenuItem>
        <Divider />
        {
          pageCreator && (
            <Stack sx={{
              px: 1
            }}
            >
              <Typography variant='subtitle2'>
                Last edited by {pageCreator.username}
              </Typography>
              <Typography variant='subtitle2'>
                Last edited at {humanFriendlyDate(lastUpdatedAt)}
              </Typography>
            </Stack>
          )
        }
      </Menu>
    </>
  );
}
