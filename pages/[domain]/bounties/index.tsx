import BountiesPage from 'components/bounties/BountiesPage';
import LoadingComponent from 'components/common/LoadingComponent';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useBounties } from 'hooks/useBounties';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import { setTitle } from 'hooks/usePageTitle';
import { useSharedPage } from 'hooks/useSharedPage';

export default function BountyPage() {
  const { bounties, loadingBounties } = useBounties();
  const { accessChecked } = useSharedPage();

  const { hasAccess: isSpaceMember, isLoadingAccess } = useHasMemberLevel('member');

  setTitle('Bounties');
  if (loadingBounties || !bounties || !accessChecked || isLoadingAccess) {
    return <LoadingComponent isLoading />;
  }
  return <BountiesPage bounties={bounties} publicMode={!isSpaceMember} />;
}

BountyPage.getLayout = getPageLayout;
