import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { InviteLink, Space } from '@prisma/client';
import getBaseLayout from 'components/common/base-layout/getLayout';
import { getInviteLink } from 'lib/invites';
import InvitationPageContent from 'components/invites';

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

export default function InvitationPage ({ error, invite }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <InvitationPageContent error={error} invite={invite} />;
}

InvitationPage.getLayout = getBaseLayout;
