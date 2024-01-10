import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import type { SxProps, Theme } from '@mui/material';
import { ListItemButton, ListItemText } from '@mui/material';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

import { useGetProposalDetails } from 'charmClient/hooks/proposals';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { usePage } from 'hooks/usePage';

/**
 * We only want to refresh individual page data if user is currently on the page
 */
export function ArchiveProposalAction({
  proposalId,
  refreshPageOnChange,
  containerStyle = {}
}: {
  proposalId: string;
  refreshPageOnChange?: boolean;
  containerStyle?: SxProps<Theme>;
}) {
  const { archiveProposal, proposals } = useProposals();

  const { data: { permissions } = {}, mutate: refreshProposal } = useGetProposalDetails(
    refreshPageOnChange ? proposalId : null
  );
  const { refreshPage } = usePage({
    pageIdOrPath: refreshPageOnChange ? proposalId : null
  });

  const proposal = proposals?.find((p) => p.id === proposalId);

  const disabled = proposal?.archived ? !permissions?.unarchive : !permissions?.archive;

  const label = proposal?.archived ? 'Unarchive' : 'Archive';

  return (
    <Tooltip title={disabled ? `You cannot ${label.toLowerCase()} this proposal` : ''}>
      <Box sx={containerStyle}>
        <ListItemButton
          data-test='header--archive-current-proposal'
          disabled={disabled}
          onClick={() => {
            archiveProposal({ archived: !proposal?.archived, proposalId }).then(() => {
              if (refreshPageOnChange) {
                refreshPage();
                refreshProposal();
              }
            });
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
