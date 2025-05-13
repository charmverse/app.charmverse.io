import { useTrackOpPageView, useTrackPageView } from 'charmClient/hooks/track';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { RewardsPage } from 'components/rewards/RewardsPage';
import { useStaticPageTitle } from 'hooks/usePageTitle';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export default function RewardsPageComponent() {
  useTrackPageView({ type: 'bounties_list' });
  useTrackOpPageView({ type: 'bounties_list' });
  const { mappedFeatures } = useSpaceFeatures();
  const rewardsTitle = mappedFeatures.rewards.title;
  useStaticPageTitle(rewardsTitle);
  return <RewardsPage title={rewardsTitle} />;
}

RewardsPageComponent.getLayout = getPageLayout;
