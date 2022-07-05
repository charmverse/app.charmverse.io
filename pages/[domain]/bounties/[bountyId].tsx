import BountyDetails from 'components/bounties/[bountyId]/BountyDetails';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import { useBounties } from 'hooks/useBounties';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function BountyPage () {

  const { updateCurrentBountyId } = useBounties();

  const router = useRouter();
  useEffect(() => {
    updateCurrentBountyId((router.query.bountyId as string) ?? null);
  }, [router.query.bountyId, router.query.pageId]);

  return (
    <ScrollableWindow>
      <BountyDetails />
    </ScrollableWindow>
  );

}

BountyPage.getLayout = getPageLayout;
