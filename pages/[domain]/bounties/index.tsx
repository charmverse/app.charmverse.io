import BountiesPage from 'components/bounties/BountiesPage';
import LoadingComponent from 'components/common/LoadingComponent';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useBounties } from 'hooks/useBounties';
import { useFeaturesAndMembers } from 'hooks/useFeaturesAndMemberProfiles';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import { setTitle } from 'hooks/usePageTitle';
import { useSharedPage } from 'hooks/useSharedPage';

export default function BountyPage() {
  const { bounties, loadingBounties } = useBounties();
  const { accessChecked } = useSharedPage();
  const { features } = useFeaturesAndMembers();
  const bountiesTitle = features.find((f) => f.id === 'bounties')?.title || 'Bounties';

  const { hasAccess: isSpaceMember, isLoadingAccess } = useHasMemberLevel('member');

  setTitle(bountiesTitle);

  if (loadingBounties || !bounties || !accessChecked || isLoadingAccess) {
    return <LoadingComponent isLoading />;
  }
  return <BountiesPage bounties={bounties} publicMode={!isSpaceMember} title={bountiesTitle} />;
}

BountyPage.getLayout = getPageLayout;
