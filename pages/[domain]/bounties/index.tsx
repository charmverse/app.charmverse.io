import BountiesPage from 'components/bounties/BountiesPage';
import LoadingComponent from 'components/common/LoadingComponent';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useBounties } from 'hooks/useBounties';
import { setTitle } from 'hooks/usePageTitle';

export default function BountyPage () {

  const { bounties, loadingBounties } = useBounties();

  setTitle('Bounties');

  if (loadingBounties || !bounties) {
    return <LoadingComponent isLoading />;
  }

  return (
    <BountiesPage bounties={bounties} />
  );

}

BountyPage.getLayout = getPageLayout;
