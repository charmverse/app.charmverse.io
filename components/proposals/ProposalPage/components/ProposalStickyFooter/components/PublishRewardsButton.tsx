import BountyIcon from '@mui/icons-material/RequestPageOutlined';

import { useCreateProposalRewards } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';

export type Props = {
  disabled: boolean;
  proposalId: string;
  onSubmit: VoidFunction;
};

export function PublishRewardsButton({ proposalId, disabled, onSubmit }: Props) {
  const { trigger, isMutating } = useCreateProposalRewards(proposalId);
  const { showMessage } = useSnackbar();

  const createRewards = async () => {
    try {
      await trigger();
      showMessage('Rewards created', 'success');
      onSubmit();
      // mutateRewards();
    } catch (e) {
      showMessage('Error creating rewards', 'error');
    }
  };

  return (
    <Button
      disabled={disabled}
      disabledTooltip='Only reviewers can publish rewards'
      color='success'
      endIcon={<BountyIcon />}
      loading={isMutating}
      onClick={createRewards}
    >
      Publish Rewards
    </Button>
  );
}
