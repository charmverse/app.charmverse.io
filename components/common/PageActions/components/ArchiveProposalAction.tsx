import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import type { SxProps, Theme } from '@mui/material';
import { ListItemButton, ListItemText } from '@mui/material';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

import { useArchiveProposal } from 'charmClient/hooks/proposals';
import { useProposal } from 'components/[pageId]/DocumentPage/hooks/useProposal';

/**
 * We only want to refresh individual page data if user is currently on the page
 */
export function ArchiveProposalAction({
  proposalId,
  containerStyle = {}
}: {
  proposalId: string;
  containerStyle?: SxProps<Theme>;
}) {
  const { trigger: archiveProposal } = useArchiveProposal({ proposalId });
  const { proposal, refreshProposal } = useProposal({
    proposalId
  });

  const permissions = proposal?.permissions;
  const disabled = proposal?.archived ? !permissions?.unarchive : !permissions?.archive;

  const label = proposal?.archived ? 'Unarchive' : 'Archive';

  return (
    <Tooltip title={disabled ? `You cannot ${label.toLowerCase()} this proposal` : ''}>
      <Box sx={containerStyle}>
        <ListItemButton
          data-test='header--archive-current-proposal'
          disabled={disabled}
          onClick={() => {
            archiveProposal({ archived: !proposal?.archived });
            refreshProposal();
          }}
        >
          <InventoryIcon
            fontSize='small'
            sx={{
              mr: 1
            }}
          />
          <ListItemText primary={`${label} proposal`} />
        </ListItemButton>
      </Box>
    </Tooltip>
  );
}
