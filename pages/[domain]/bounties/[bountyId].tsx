import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import BountyDetails from 'components/bounties/[bountyId]/BountyDetails';
import BountyDetailsNew from 'components/bounties/[bountyId]/BountyDetails_v3';
import PageLayout from 'components/common/PageLayout';
import { setTitle } from 'hooks/usePageTitle';
import { ReactElement, useState, useEffect } from 'react';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import { useRouter } from 'next/router';
import { useBounties } from 'hooks/useBounties';

export default function BountyPage () {

  const { updateCurrentBountyId } = useBounties();

  setTitle('Bounties');
  const router = useRouter();

  // TEMPORARY
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    updateCurrentBountyId((router.query.bountyId as string) ?? null);

    console.log('Updating id', router.query.bountyId);
  }, [router.query.bountyId]);

  return (
    <>
      <Switch onChange={(ev) => setShowNew(ev.target.checked)} />
      {
        showNew ? <BountyDetailsNew /> : <BountyDetails />
      }

    </>

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
