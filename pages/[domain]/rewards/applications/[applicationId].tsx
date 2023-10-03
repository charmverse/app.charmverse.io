import { useRouter } from 'next/router';

import getPageLayout from 'components/common/PageLayout/getLayout';
import { RewardApplicationPageComponent } from 'components/rewards/components/RewardApplicationPage/RewardApplicationPage';

export default function RewardApplicationPage() {
  const router = useRouter();

  const applicationId = router.query.applicationId as string;

  if (!applicationId) {
    return null;
  }
  // TODO - Add event type
  // useTrackPageView({ type: 'b' });
  return <RewardApplicationPageComponent applicationId={applicationId} />;
}

RewardApplicationPage.getLayout = getPageLayout;
