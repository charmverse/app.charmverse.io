import { Box } from '@mui/material';

import { useArchiveProposal } from 'charmClient/hooks/proposals';
import { AlertBanner } from 'components/common/Banners/Alert';
import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';

export function ProposalArchivedBanner({ proposalId, disabled }: { proposalId: string; disabled: boolean }) {
  const { trigger: archiveProposal, isMutating } = useArchiveProposal({ proposalId });

  const { showError } = useSnackbar();

  async function restorePage() {
    try {
      archiveProposal({ archived: false });
    } catch (err) {
      showError(err);
    }
  }

  return (
    <AlertBanner
      severity='error'
      action={
        <Button
          disabled={disabled}
          disabledTooltip='You do not have permission to restore this page'
          color={'white' as any}
          loading={isMutating}
          onClick={restorePage}
          variant='outlined'
          size='small'
        >
          Unarchive
        </Button>
      }
    >
      <Box display='flex' gap={1} alignItems='center' data-test='archived-page-banner'>
        <div>Archived</div>
      </Box>
    </AlertBanner>
  );
}
