import { useTrackPageView } from 'charmClient/hooks/track';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { RewardsPageWithProviders } from 'components/rewards/RewardsPageWithProviders';

export default function RewardsPageComponent() {
  useTrackPageView({ type: 'bounties_list' });
  return <RewardsPageWithProviders />;
}

RewardsPageComponent.getLayout = getPageLayout;
