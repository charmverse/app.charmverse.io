import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useRef, useState, useEffect } from 'react';
import { validate } from 'uuid';

import { getLayout as getBaseLayout } from 'components/common/BaseLayout/getLayout';
import type { MagicLinkResponseStatus } from 'components/invite/page/PageInviteLink';
import { PageInviteLink } from 'components/invite/page/PageInviteLink';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { getPermissionsClient } from 'lib/permissions/api';
import { withSessionSsr } from 'lib/session/withSession';
import { getValidCustomDomain } from 'lib/utilities/domains/getValidCustomDomain';
import { getValidSubdomain } from 'lib/utilities/getValidSubdomain';

type Props = { email?: string; error?: 'invalid_page_id' };

export const getServerSideProps: GetServerSideProps = withSessionSsr<Props>(async (context) => {
  const pageId = context.query.id as string;
  const requestedEmail = typeof context.query.email === 'string' ? context.query.email : undefined;
  const sessionUserId = context.req.session?.user?.id;

  if (!pageId || !validate(pageId)) {
    return {
      props: {
        error: 'invalid_page_id'
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
      const isDomainInPath = !getValidCustomDomain(hostName) && !getValidSubdomain(hostName);
      log.debug('[page-invite] Redirecting user to view page', {
        pageId,
        userId: sessionUserId
      });
      return {
        redirect: {
          destination: `/${isDomainInPath ? `${page.space.domain}/` : ''}${page.path}`,
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
  const { requestMagicLink, status } = useMagicLink();
  return (
    <>
      <Head>
        <meta name='robots' content='noindex' />
      </Head>
      <PageInviteLink status={status} email={email} submitEmail={requestMagicLink} />
    </>
  );
}

function useMagicLink() {
  const router = useRouter();
  const { requestMagicLinkViaFirebase, validateMagicLink, emailForSignIn } = useFirebaseAuth({
    authenticatePath: router.asPath
  });
  const sendingMagicLink = useRef(false);
  const [status, setStatus] = useState<MagicLinkResponseStatus | undefined>();

  async function requestMagicLink(email: string) {
    if (status !== 'requesting-link') {
      sendingMagicLink.current = true;
      try {
        setStatus('requesting-link');
        await requestMagicLinkViaFirebase({ email, redirectUrl: window.location.pathname });
        setStatus('sent-link');
      } catch (error) {
        if ((error as any)?.code === 'auth/invalid-email') {
          setStatus('error-invalid-email');
        } else {
          log.error('Error requesting firebase magic link', { error });
          setStatus('error');
        }
      }
    }
  }

  // attempt to validate email on first load
  useEffect(() => {
    async function init() {
      if (emailForSignIn && status === undefined) {
        try {
          setStatus('verifying-email');
          await validateMagicLink(emailForSignIn);
          log.info('Magic link validated, redirect user to page');
          setStatus('verified-email');
          // refresh page to redirect user
          router.replace(router.asPath);
        } catch (error: any) {
          log.error('Error validating firebase magic link', { error });
          if ((error as any)?.code === 'auth/invalid-action-code') {
            setStatus('error-invalid-code');
          } else {
            setStatus('error');
          }
        }
      }
    }
    init();
  }, [emailForSignIn, status]);

  return {
    requestMagicLink,
    validateMagicLink,
    status
  };
}

PageInviteLinkComponent.getLayout = getBaseLayout;
