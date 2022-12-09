import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';

import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import InviteLinkPage from 'components/invite/InviteLinkPage';
import InviteLinkPageError from 'components/invite/InviteLinkPageError';
import { getInviteLink } from 'lib/invites';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const inviteCode = context.query.inviteCode as string;
  const { invite, expired } = await getInviteLink(inviteCode);

  if (!invite) {
    return {
      props: {
        error: 'Invitation not found'
      }
    };
  }
  if (expired) {
    return {
      props: {
        error: 'This link has expired'
      }
    };
  }

  return {
    props: {
      invite
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
