import BountiesPage from 'components/bounties/BountiesPage';
import LoadingComponent from 'components/common/LoadingComponent';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useBounties } from 'hooks/useBounties';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { setTitle } from 'hooks/usePageTitle';
import { useSharedPage } from 'hooks/useSharedPage';

export default function BountyPage() {
  const { bounties, loadingBounties } = useBounties();
  const { accessChecked } = useSharedPage();

  const isSpaceMember = useIsSpaceMember();

  setTitle('Bounties');
  if (loadingBounties || !bounties || !accessChecked) {
    return <LoadingComponent isLoading />;
  }
  return <BountiesPage bounties={bounties} publicMode={!isSpaceMember} />;
}

BountyPage.getLayout = getPageLayout;
