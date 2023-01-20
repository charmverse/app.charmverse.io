import BountiesPage from 'components/bounties/BountiesPage';
import LoadingComponent from 'components/common/LoadingComponent';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useBounties } from 'hooks/useBounties';
import { setTitle } from 'hooks/usePageTitle';
import { useSharedPage } from 'hooks/useSharedPage';

export default function BountyPage() {
  const { bounties, loadingBounties } = useBounties();
  const { hasPublicPageAccess, accessCheked } = useSharedPage();
  setTitle('Bounties');
  if (loadingBounties || !bounties || !accessCheked) {
    return <LoadingComponent isLoading />;
  }
  return <BountiesPage bounties={bounties} publicMode={hasPublicPageAccess} />;
}

BountyPage.getLayout = getPageLayout;
