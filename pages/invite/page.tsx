import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { validate } from 'uuid';

import { getLayout as getBaseLayout } from 'components/common/BaseLayout/getLayout';
import { useMagicLink } from 'components/invite/page/hooks/useMagicLink';
import type { MagicLinkResponseStatus } from 'components/invite/page/PageInviteLink';
import { PageInviteLink } from 'components/invite/page/PageInviteLink';
import { getPermissionsClient } from 'lib/permissions/api';
import { withSessionSsr } from 'lib/session/withSession';
import { getCustomDomainFromHost } from 'lib/utilities/domains/getCustomDomainFromHost';
import { getSpaceDomainFromHost } from 'lib/utilities/domains/getSpaceDomainFromHost';

type Props = { email?: string; error?: Extract<MagicLinkResponseStatus, 'error_invalid_page_id'> };

export const getServerSideProps: GetServerSideProps = withSessionSsr<Props>(async (context) => {
  const pageId = context.query.id as string;
  const requestedEmail = typeof context.query.email === 'string' ? context.query.email : undefined;
  const sessionUserId = context.req.session?.user?.id;

  if (!pageId || !validate(pageId)) {
    return {
      props: {
        error: 'error_invalid_page_id'
      }
    };
  }

  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      path: true,
      title: true,
      space: {
        select: { id: true, customDomain: true, domain: true }
      }
    }
  });

  if (page) {
    // Page ID might be a path now, so first we fetch the page and if found, can pass the id from the found page to check if we should actually send it to the requester
    const { client } = await getPermissionsClient({ resourceId: page.space.id, resourceIdType: 'space' });
    const permissions = await client.pages.computePagePermissions({
      resourceId: pageId,
      userId: sessionUserId
    });

    if (permissions.read) {
      // redirect to page, taking consideration for custom domains
      const hostName = context.req.headers?.host;
      const isDomainInPath = !getCustomDomainFromHost(hostName) && !getSpaceDomainFromHost(hostName);
      log.debug('[page-invite] Redirecting user to view page', {
        pageId,
        userId: sessionUserId
      });
      return {
        redirect: {
          destination: encodeURI(`/${isDomainInPath ? `${page.space.domain}/` : ''}${page.path}`),
          permanent: false
        }
      };
    } else {
      log.warn('[page-invite] User does not have permission to view page', {
        permissions,
        pageId,
        userId: sessionUserId
      });
    }
  } else {
    log.warn('[page-invite] Request for page that does not exist', {
      pageId,
      userId: sessionUserId
    });
  }

  return { props: { email: requestedEmail } };
});

export default function PageInviteLinkComponent({ email, error }: Props) {
  const { requestMagicLink, status } = useMagicLink({ error });
  return (
    <>
      <Head>
        <meta name='robots' content='noindex' />
      </Head>
      <PageInviteLink status={status} email={email} submitEmail={requestMagicLink} />
    </>
  );
}

PageInviteLinkComponent.getLayout = getBaseLayout;
