import BountyList from 'components/bounties/BountyList';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { setTitle } from 'hooks/usePageTitle';
import { useBounties } from 'hooks/useBounties';
import LoadingComponent from 'components/common/LoadingComponent';

export default function BountyPage () {

  const { bounties, loadingBounties } = useBounties();

  setTitle('Bounties');

  if (loadingBounties || !bounties) {
    return <LoadingComponent isLoading />;
  }

  return (
    <BountyList bounties={bounties} />
  );

}

BountyPage.getLayout = getPageLayout;
