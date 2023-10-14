import { useTrackPageView } from 'charmClient/hooks/track';
import LoadingComponent from 'components/common/LoadingComponent';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { RewardsPageWithProviders } from 'components/rewards/RewardsPageWithProviders';
import { useFeaturesAndMembers } from 'hooks/useFeaturesAndMemberProfiles';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import { setTitle } from 'hooks/usePageTitle';
import { useSharedPage } from 'hooks/useSharedPage';

export default function RewardsPage() {
  const { rewards, isLoading } = useRewards();
  const { accessChecked } = useSharedPage();
  const { mappedFeatures } = useFeaturesAndMembers();
  const bountiesTitle = mappedFeatures.bounties.title;

  const { hasAccess: isSpaceMember, isLoadingAccess } = useHasMemberLevel('member');

  useTrackPageView({ type: 'bounties_list' });

  setTitle(bountiesTitle);

  if (isLoading || !rewards || !accessChecked || isLoadingAccess) {
    return <LoadingComponent isLoading />;
  }
  return <RewardsPageWithProviders />;
}

RewardsPage.getLayout = getPageLayout;
