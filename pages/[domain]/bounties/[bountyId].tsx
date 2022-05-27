import BountyDetails from 'components/bounties/[bountyId]/BountyDetails';
import PageLayout from 'components/common/PageLayout';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import { useBounties } from 'hooks/useBounties';
import { setTitle } from 'hooks/usePageTitle';
import { useRouter } from 'next/router';
import { ReactElement, useEffect } from 'react';

export default function BountyPage () {

  const { updateCurrentBountyId } = useBounties();

  setTitle('Bounties');
  const router = useRouter();
  useEffect(() => {
    updateCurrentBountyId((router.query.bountyId as string) ?? null);
  }, [router.query.bountyId]);

  return (
    <BountyDetails />

  );

}

BountyPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      <ScrollableWindow>
        {page}
      </ScrollableWindow>
    </PageLayout>
  );
};
