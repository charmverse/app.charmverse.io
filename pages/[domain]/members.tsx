import { useTrackPageView } from 'charmClient/hooks/track';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { MemberDirectoryPage } from 'components/members/MemberDirectoryPage';
import { useStaticPageTitle } from 'hooks/usePageTitle';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export default function MemberDirectory() {
  const { mappedFeatures } = useSpaceFeatures();
  const memberDirectoryTitle = mappedFeatures.member_directory.title;
  useTrackPageView({ type: 'members_list' });

  useStaticPageTitle(memberDirectoryTitle);

  return <MemberDirectoryPage title={memberDirectoryTitle} />;
}

MemberDirectory.getLayout = getPageLayout;
