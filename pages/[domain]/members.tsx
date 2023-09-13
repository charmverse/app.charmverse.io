import getPageLayout from 'components/common/PageLayout/getLayout';
import MemberDirectoryPage from 'components/members/MemberDirectoryPage';
import { useFeaturesAndMembers } from 'hooks/useFeaturesAndMemberProfiles';
import { setTitle } from 'hooks/usePageTitle';

export default function MemberDirectory() {
  const { mappedFeatures } = useFeaturesAndMembers();
  const memberDirectoryTitle = mappedFeatures.member_directory.title;

  setTitle(memberDirectoryTitle);

  return <MemberDirectoryPage title={memberDirectoryTitle} />;
}

MemberDirectory.getLayout = getPageLayout;
