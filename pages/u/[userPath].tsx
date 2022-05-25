
import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import UserProfile from 'components/u/[userPath]/UserProfile';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import charmClient from 'charmClient';

export default function InvitationPage () {
  const router = useRouter();
  const { data: user } = useSWR(`users/${router.query.userPath}`, () => charmClient.getUser());
  if (!user) {
    return null;
  }
  return (
    <UserProfile user={user} />
  );
}

InvitationPage.getLayout = getBaseLayout;
