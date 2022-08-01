import BountiesPage from 'components/bounties/BountiesPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { setTitle } from 'hooks/usePageTitle';
import { useBounties } from 'hooks/useBounties';
import LoadingComponent from 'components/common/LoadingComponent';

export default function BountyPage () {

  const { bounties, loadingBounties, refreshBounty } = useBounties();

  setTitle('Bounties');

  if (loadingBounties || !bounties) {
    return <LoadingComponent isLoading />;
  }

  return (
    <BountiesPage bounties={bounties} refreshBounty={refreshBounty} />
  );

}

BountyPage.getLayout = getPageLayout;
