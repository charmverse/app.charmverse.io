import { useCreateProposalRewards } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useSnackbar } from 'hooks/useSnackbar';

type Props = {
  proposalId: string;
};

export function CreateProposalRewardsButton({ proposalId }: Props) {
  const { trigger, isMutating } = useCreateProposalRewards(proposalId);
  const { mutateProposals } = useProposals();
  const { showMessage } = useSnackbar();
  const { mutateRewards } = useRewards();

  const createRewards = async () => {
    await trigger();
    showMessage('Rewards created', 'success');

    mutateProposals();
    mutateRewards();
  };

  return (
    <Button onClick={createRewards} loading={isMutating} size='small'>
      Create rewards
    </Button>
  );
}
