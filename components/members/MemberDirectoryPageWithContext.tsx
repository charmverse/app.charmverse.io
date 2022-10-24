import MemberDirectoryPage from 'components/members/MemberDirectoryPage';
import { MemberPropertiesProvider } from 'hooks/useMemberProperties';

export default function MemberDirectoryPageWithContext () {
  return (
    <MemberPropertiesProvider>
      <MemberDirectoryPage />
    </MemberPropertiesProvider>
  );
}
