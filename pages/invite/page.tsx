import { prisma } from '@charmverse/core/prisma-client';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { validate } from 'uuid';

import { getLayout as getBaseLayout } from 'components/common/BaseLayout/getLayout';
import { InviteToPage } from 'components/invite/page/InviteToPage';
import { getPermissionsClient } from 'lib/permissions/api';
import { withSessionSsr } from 'lib/session/withSession';
import { getValidCustomDomain } from 'lib/utilities/domains/getValidCustomDomain';
import { getValidSubdomain } from 'lib/utilities/getValidSubdomain';

export const getServerSideProps: GetServerSideProps = withSessionSsr(async (context) => {
  const pageId = context.query.id as string;

  const isValidPageId = pageId && validate(pageId);

  const page =
    isValidPageId &&
    (await prisma.page.findUnique({
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
    }));

  if (page) {
    // Page ID might be a path now, so first we fetch the page and if found, can pass the id from the found page to check if we should actually send it to the requester
    const { client } = await getPermissionsClient({ resourceId: page.space.id, resourceIdType: 'space' });
    const sessionUserId = context.req.session?.user?.id;
    const permissions = await client.pages.computePagePermissions({
      resourceId: pageId,
      userId: sessionUserId
    });

    if (permissions.read) {
      // redirect to page
      const hostName = context.req.headers?.host;
      const isDomainInPath = !getValidCustomDomain(hostName) && !getValidSubdomain(hostName);
      return {
        redirect: {
          // TODO: support subdomain and custom domain
          destination: `/${isDomainInPath ? `${page.space.domain}/` : ''}${page.path}`,
          permanent: false
        }
      };
    }
  }

  return { props: { email: context.query.email } };
});

export default function InviteToPageComponent(props: { email?: string }) {
  return (
    <>
      <Head>
        <meta name='robots' content='noindex' />
      </Head>
      <InviteToPage {...props} />
    </>
  );
}

InviteToPageComponent.getLayout = getBaseLayout;
