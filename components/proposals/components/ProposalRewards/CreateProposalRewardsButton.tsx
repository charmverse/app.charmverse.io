import { useCreateProposalRewards } from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { useProposals } from 'components/proposals/hooks/useProposals';

type Props = {
  proposalId: string;
};

export function CreateProposalRewardsButton({ proposalId }: Props) {
  const { trigger, isMutating } = useCreateProposalRewards(proposalId);
  const { refreshProposal } = useProposals();

  const createRewards = async () => {
    await trigger();
    await refreshProposal(proposalId);
  };

  return (
    <Button onClick={createRewards} loading={isMutating} size='small'>
      Create rewards
    </Button>
  );
}
