import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { GetServerSidePropsContext } from 'next';

import ErrorPage from 'components/common/errors/ErrorPage';
import { getPagePath } from 'lib/utils/domains/getPagePath';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { pageId } = ctx.params ?? {};
  if (!pageId || !stringUtils.isUUID(pageId as string)) {
    return {};
  }

  const page = await prisma.page.findUnique({
    where: {
      id: pageId as string
    },
    select: {
      path: true,
      space: {
        select: {
          domain: true
        }
      }
    }
  });

  if (!page) {
    return {};
  }

  return {
    redirect: {
      destination: getPagePath({
        hostName: ctx.req.headers.host,
        path: page.path,
        spaceDomain: page.space.domain
      }),
      permanent: false
    }
  };
}

export default function Permalink() {
  return <ErrorPage message='Page not found' />;
}
