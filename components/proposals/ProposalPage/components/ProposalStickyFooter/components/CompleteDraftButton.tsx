import { ArrowForwardIos } from '@mui/icons-material';

import { useUpdateProposalStatusOnly } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';

export type Props = {
  proposalId: string;
  nextStep?: { title: string };
  onSubmit?: VoidFunction;
};

export function CompleteDraftButton({ proposalId, nextStep, onSubmit }: Props) {
  const { showMessage } = useSnackbar();
  const { trigger: updateProposalStatus, isMutating } = useUpdateProposalStatusOnly({ proposalId });

  async function onClick() {
    try {
      await updateProposalStatus({ newStatus: 'published' });
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
    onSubmit?.();
  }
  // endIcon={<ArrowForwardIos />}
  return (
    <Button data-test='complete-draft-button' loading={isMutating} onClick={onClick}>
      {/* Move to {nextStep?.title} */}
      Publish
    </Button>
  );
}
