import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import { getLayout as getBaseLayout } from 'components/common/BaseLayout/getLayout';
import InviteLinkPageError from 'components/invite/SpaceInviteError';
import InviteLinkPage from 'components/invite/SpaceInviteLink';
import type { InviteLinkPopulated } from 'lib/invites/getInviteLink';
import { getInviteLink } from 'lib/invites/getInviteLink';
import { checkUserSpaceBanStatus } from 'lib/members/checkUserSpaceBanStatus';
import { withSessionSsr } from 'lib/session/withSession';

type Props = { error: 'invalid' | 'banned' | null; invite: InviteLinkPopulated | null };

export const getServerSideProps: GetServerSideProps = withSessionSsr<Props>(async (context) => {
  const inviteCode = context.query.inviteCode as string;
  const inviteLink = await getInviteLink(inviteCode);
  const user = context.req.session?.user;

  if (!inviteLink) {
    return {
      props: {
        error: 'invalid',
        invite: null
      }
    };
  }
  if (!inviteLink.valid) {
    return {
      props: {
        error: 'invalid',
        invite: null
      }
    };
  }

  if (user?.id) {
    const isUserBannedFromSpace = await checkUserSpaceBanStatus({
      userId: user.id,
      spaceId: inviteLink.invite.spaceId
    });

    if (isUserBannedFromSpace) {
      return {
        props: {
          invite: null,
          error: 'banned'
        }
      };
    }
  }

  return {
    props: {
      invite: inviteLink.invite,
      error: null
    }
  };
});

export default function InvitationPage({ invite, error }: Props) {
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
  return <InviteLinkPageError reason={error} />;
}

InvitationPage.getLayout = getBaseLayout;
