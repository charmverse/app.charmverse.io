import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import { ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';

import { useArchiveProposal } from 'charmClient/hooks/proposals';
import { useProposal } from 'components/[pageId]/DocumentPage/hooks/useProposal';
import { useSnackbar } from 'hooks/useSnackbar';

export function ArchiveProposalAction({ proposalId }: { proposalId: string }) {
  const { trigger: archiveProposal } = useArchiveProposal({ proposalId });
  const { proposal } = useProposal({
    proposalId
  });
  const { showError } = useSnackbar();

  const permissions = proposal?.permissions;
  const disabled = proposal && (proposal.archived ? !permissions?.unarchive : !permissions?.archive);

  const label = proposal?.archived ? 'Unarchive' : 'Archive';

  return (
    <Tooltip title={disabled ? `You cannot ${label.toLowerCase()} this proposal` : ''} disableInteractive>
      <div>
        <MenuItem
          data-test='header--archive-current-proposal'
          disabled={disabled}
          onClick={async () => {
            try {
              await archiveProposal({ archived: !proposal?.archived });
              // refreshProposal();
            } catch (error) {
              showError(error);
            }
          }}
        >
          <ListItemIcon>
            <InventoryIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText primary={`${label}`} />
        </MenuItem>
      </div>
    </Tooltip>
  );
}
