import getPageLayout from 'components/common/PageLayout/getLayout';
import MemberDirectoryPage from 'components/members/MemberDirectoryPage';
import { setTitle } from 'hooks/usePageTitle';

export default function MemberDirectory () {
  setTitle('Member Directory');

  return (
    <MemberDirectoryPage />
  );
}

MemberDirectory.getLayout = getPageLayout;
