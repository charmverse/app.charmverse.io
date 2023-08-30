import { prisma } from '@charmverse/core/prisma-client';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { validate } from 'uuid';

import { getLayout as getBaseLayout } from 'components/common/BaseLayout/getLayout';
import { InviteToPage } from 'components/invite/page/InviteToPage';
import { withSessionSsr } from 'lib/session/withSession';

export const getServerSideProps: GetServerSideProps = withSessionSsr(async (context) => {
  const pageId = context.query.id as string;

  if (!pageId || !validate(pageId)) {
    return {
      notFound: true
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
        select: { id: true, customDomain: true }
      }
    }
  });
  if (!page) {
    return {
      notFound: true
    };
  }

  // const pageProps: InviteToPageProps = {
  //   page
  // };

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
