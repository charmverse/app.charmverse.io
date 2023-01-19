import { useEffect } from 'react';

import BountiesPage from 'components/bounties/BountiesPage';
import LoadingComponent from 'components/common/LoadingComponent';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { usePublicPage } from 'components/publicPages/hooks/usePublicPage';
import { useBounties } from 'hooks/useBounties';
import { setTitle } from 'hooks/usePageTitle';

export default function BountyPage() {
  const { bounties, loadingBounties, setPublicSpaceId } = useBounties();
  const { publicSpace, accessCheked } = usePublicPage();

  useEffect(() => {
    setPublicSpaceId(publicSpace?.id || null);
  }, []);

  setTitle('Bounties');

  if (loadingBounties || !bounties || !publicSpace || !accessCheked) {
    return <LoadingComponent isLoading />;
  }

  return <BountiesPage bounties={bounties} publicMode={publicSpace.publicBountyBoard || false} />;
}

BountyPage.getLayout = getPageLayout;
