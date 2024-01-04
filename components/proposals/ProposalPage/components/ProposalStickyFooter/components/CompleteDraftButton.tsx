import { useUpdateProposalStatusOnly } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';

export type Props = {
  proposalId: string;
  onSubmit?: VoidFunction;
};

export function CompleteDraftButton({ proposalId, onSubmit }: Props) {
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

  return (
    <Button data-test='complete-draft-button' loading={isMutating} onClick={onClick}>
      Publish
    </Button>
  );
}
