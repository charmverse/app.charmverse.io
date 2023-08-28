import getPageLayout from 'components/common/PageLayout/getLayout';
import MemberDirectoryPage from 'components/members/MemberDirectoryPage';
import { useFeaturesAndMembers } from 'hooks/useFeaturesAndMemberProfiles';
import { setTitle } from 'hooks/usePageTitle';

export default function MemberDirectory() {
  const { features } = useFeaturesAndMembers();
  const memberDirectoryTitle = features.find((f) => f.id === 'member_directory')?.title || 'Member Directory';

  setTitle(memberDirectoryTitle);

  return <MemberDirectoryPage title={memberDirectoryTitle} />;
}

MemberDirectory.getLayout = getPageLayout;
