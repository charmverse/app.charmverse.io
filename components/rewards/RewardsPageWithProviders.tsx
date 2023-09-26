import { RewardsProvider } from 'components/rewards/hooks/useRewards';
import { RewardsBoardProvider } from 'components/rewards/hooks/useRewardsBoard';
import { RewardsPage } from 'components/rewards/RewardsPage';
import { useFeaturesAndMembers } from 'hooks/useFeaturesAndMemberProfiles';
import { setTitle } from 'hooks/usePageTitle';
import { ProposalBlocksProvider } from 'hooks/useProposalBlocks';

export function RewardsPageWithProviders() {
  const { mappedFeatures } = useFeaturesAndMembers();
  const rewardsTitle = mappedFeatures.rewards.title;

  setTitle(rewardsTitle);

  return (
    <RewardsProvider>
      <ProposalBlocksProvider>
        <RewardsBoardProvider>
          <RewardsPage title={rewardsTitle} />
        </RewardsBoardProvider>
      </ProposalBlocksProvider>
    </RewardsProvider>
  );
}
