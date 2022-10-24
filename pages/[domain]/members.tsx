import getPageLayout from 'components/common/PageLayout/getLayout';
import MemberDirectoryPageWithContext from 'components/members/MemberDirectoryPageWithContext';
import { setTitle } from 'hooks/usePageTitle';

export default function MemberDirectory () {
  setTitle('Member Directory');

  return (
    <MemberDirectoryPageWithContext />
  );
}

MemberDirectory.getLayout = getPageLayout;
