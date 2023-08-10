import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';

import { getLayout as getBaseLayout } from 'components/common/BaseLayout/BaseLayout';
import InviteLinkPage from 'components/invite/InviteLinkPage';
import InviteLinkPageError from 'components/invite/InviteLinkPageError';
import { getInviteLink } from 'lib/invites/getInviteLink';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const inviteCode = context.query.inviteCode as string;
  const inviteLink = await getInviteLink(inviteCode);

  if (!inviteLink) {
    return {
      props: {
        error: 'Invitation not found'
      }
    };
  }
  if (!inviteLink.valid) {
    return {
      props: {
        error: 'This link is invalid'
      }
    };
  }

  return {
    props: {
      invite: inviteLink.invite
    }
  };
};

export default function InvitationPage({ invite }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  if (invite) {
    <Head>
      <meta name='robots' content='noindex' />
    </Head>;
    return <InviteLinkPage invite={invite} />;
  }
  return <InviteLinkPageError />;
}

InvitationPage.getLayout = getBaseLayout;
