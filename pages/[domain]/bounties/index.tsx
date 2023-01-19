import BountiesPage from 'components/bounties/BountiesPage';
import LoadingComponent from 'components/common/LoadingComponent';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { usePublicPage } from 'components/publicPages/hooks/usePublicPage';
import { useBounties } from 'hooks/useBounties';
import { setTitle } from 'hooks/usePageTitle';

export default function BountyPage() {
  const { bounties, loadingBounties } = useBounties();
  const { hasPublicPageAccess, accessCheked } = usePublicPage();
  setTitle('Bounties');
  if (loadingBounties || !bounties || !accessCheked) {
    return <LoadingComponent isLoading />;
  }
  return <BountiesPage bounties={bounties} publicMode={hasPublicPageAccess} />;
}

BountyPage.getLayout = getPageLayout;
