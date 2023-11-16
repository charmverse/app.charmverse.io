import { useRouter } from 'next/router';

import getPageLayout from 'components/common/PageLayout/getLayout';
import { RewardApplicationPage } from 'components/rewards/components/RewardApplicationPage/RewardApplicationPage';

export default function RewardApplicationPageComponent() {
  const router = useRouter();

  const applicationId = router.query.applicationId as string;

  if (!applicationId) {
    return null;
  }
  // TODO - Add event type
  // useTrackPageView({ type: 'b' });
  return <RewardApplicationPage applicationId={applicationId} />;
}

RewardApplicationPageComponent.getLayout = getPageLayout;
