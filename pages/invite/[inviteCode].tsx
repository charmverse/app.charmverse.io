import getBaseLayout from 'components/common/base-layout/getLayout';
import { getServerSideProps, InviteProps } from 'lib/invites';
import InvitationPageContent from 'components/invites';

export { getServerSideProps };

export function InvitationPage ({ invitation }: InviteProps) {
  return <InvitationPageContent invitation={invitation} />;
}

InvitationPage.getLayout = getBaseLayout;
