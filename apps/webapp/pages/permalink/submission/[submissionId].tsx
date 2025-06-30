import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@packages/core/utilities';
import { getSubmissionPagePath } from '@packages/lib/utils/domains/getPagePath';
import type { GetServerSidePropsContext } from 'next';

import ErrorPage from 'components/common/errors/ErrorPage';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { submissionId } = ctx.params ?? {};
  if (!submissionId || !stringUtils.isUUID(submissionId as string)) {
    return {};
  }

  const submissionPage = await prisma.application.findUnique({
    where: {
      id: submissionId as string
    },
    select: {
      bounty: {
        select: {
          space: {
            select: {
              domain: true
            }
          }
        }
      }
    }
  });

  if (!submissionPage) {
    return {};
  }

  return {
    redirect: {
      destination: getSubmissionPagePath({
        hostName: ctx.req.headers.host,
        submissionId: submissionId as string,
        spaceDomain: submissionPage.bounty.space.domain
      }),
      permanent: false
    }
  };
}

export default function SubmissionPermalink() {
  return <ErrorPage message='Page not found' />;
}
