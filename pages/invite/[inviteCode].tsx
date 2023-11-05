import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import { getLayout as getBaseLayout } from 'components/common/BaseLayout/getLayout';
import InviteLinkPageError from 'components/invite/SpaceInviteError';
import InviteLinkPage from 'components/invite/SpaceInviteLink';
import type { InviteLinkPopulated } from 'lib/invites/getInviteLink';
import { getInviteLink } from 'lib/invites/getInviteLink';
import { withSessionSsr } from 'lib/session/withSession';

type Props = { invite?: InviteLinkPopulated };

export const getServerSideProps: GetServerSideProps = withSessionSsr<Props>(async (context) => {
  const inviteCode = context.query.inviteCode as string;
  const inviteLink = await getInviteLink(inviteCode);

  if (!inviteLink) {
    return {
      props: {}
    };
  }
  if (!inviteLink.valid) {
    return {
      props: {}
    };
  }

  return {
    props: {
      invite: inviteLink.invite
    }
  };
});

export default function InvitationPage({ invite }: Props) {
  if (invite) {
    return (
      <>
        <Head>
          <meta name='robots' content='noindex' />
        </Head>
        <InviteLinkPage invite={invite} />
      </>
    );
  }
  return <InviteLinkPageError />;
}

InvitationPage.getLayout = getBaseLayout;
