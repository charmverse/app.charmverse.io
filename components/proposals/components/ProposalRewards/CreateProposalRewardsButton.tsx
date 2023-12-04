import { useCreateProposalRewards, useGetProposalDetails } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useSnackbar } from 'hooks/useSnackbar';

type Props = {
  proposalId: string;
};

export function CreateProposalRewardsButton({ proposalId }: Props) {
  const { trigger, isMutating } = useCreateProposalRewards(proposalId);
  const { refreshProposal } = useProposals();
  const { mutate } = useGetProposalDetails(proposalId);
  const { showMessage } = useSnackbar();
  const { mutateRewards } = useRewards();

  const createRewards = async () => {
    await trigger();
    showMessage('Rewards created', 'success');

    mutate();
    refreshProposal(proposalId);
    mutateRewards();
  };

  return (
    <Button onClick={createRewards} loading={isMutating} size='small'>
      Create rewards
    </Button>
  );
}
