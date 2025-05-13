import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import { getLayout as getBaseLayout } from 'components/common/BaseLayout/getLayout';
import InviteLinkPageError from 'components/invite/SpaceInviteError';
import type { Props } from 'components/invite/SpaceInviteLink';
import InviteLinkPage from 'components/invite/SpaceInviteLink';
import { getInviteLink } from '@packages/lib/invites/getInviteLink';
import { withSessionSsr } from '@packages/lib/session/withSession';

export const getServerSideProps: GetServerSideProps = withSessionSsr<Partial<Props>>(async (context) => {
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
      invite: {
        id: inviteLink.invite.id,
        visibleOn: inviteLink.invite.visibleOn
      },
      space: {
        id: inviteLink.invite.space.id,
        customDomain: inviteLink.invite.space.customDomain,
        domain: inviteLink.invite.space.domain,
        spaceImage: inviteLink.invite.space.spaceImage,
        name: inviteLink.invite.space.name
      }
    }
  };
});

export default function InvitationPage({ invite, space }: Props) {
  if (invite) {
    return (
      <>
        <Head>
          <meta name='robots' content='noindex' />
        </Head>
        <InviteLinkPage invite={invite} space={space} />
      </>
    );
  }
  return <InviteLinkPageError />;
}

InvitationPage.getLayout = getBaseLayout;
