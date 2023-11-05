import { useTrackPageView } from 'charmClient/hooks/track';
import { BountiesPage } from 'components/bounties/BountiesPage';
import LoadingComponent from 'components/common/LoadingComponent';
import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageDialogGlobal } from 'components/common/PageDialog/PageDialogGlobal';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useBounties } from 'hooks/useBounties';
import { useFeaturesAndMembers } from 'hooks/useFeaturesAndMemberProfiles';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import { setTitle } from 'hooks/usePageTitle';
import { useSharedPage } from 'hooks/useSharedPage';

export default function BountyPage() {
  const { bounties, loadingBounties } = useBounties();
  const { accessChecked } = useSharedPage();
  const { mappedFeatures } = useFeaturesAndMembers();
  const bountiesTitle = mappedFeatures.bounties.title;

  const { hasAccess: isSpaceMember, isLoadingAccess } = useHasMemberLevel('member');

  useTrackPageView({ type: 'bounties_list' });

  setTitle(bountiesTitle);

  if (loadingBounties || !bounties || !accessChecked || isLoadingAccess) {
    return <LoadingComponent isLoading />;
  }
  return (
    <PageDialogProvider>
      <BountiesPage bounties={bounties} publicMode={!isSpaceMember} title={bountiesTitle} />
      <PageDialogGlobal />
    </PageDialogProvider>
  );
}

BountyPage.getLayout = getPageLayout;
