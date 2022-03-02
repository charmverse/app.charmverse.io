import { ReactElement, useEffect } from 'react';
import { PageLayout } from 'components/common/page-layout';
import { usePageTitle } from 'hooks/usePageTitle';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';
import { prisma } from 'db';
import { untitledPage } from 'seedData';
import { withSessionSsr } from 'lib/session/withSession';

import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = withSessionSsr(async (context) => {

  const domain = context.query.domain as string;
  const space = await prisma.space.findUnique({ where: { domain } });
  if (!space) {
    console.error(`No space found by domain: ${domain}`);
    return {
      notFound: true
    };
  }
  let firstPage = await prisma.page.findFirst({ where: { spaceId: space.id } });
  if (!firstPage) {

    const userId = context.req.session.user.id;

    firstPage = await prisma.page.create({
      data: untitledPage({ userId, spaceId: space.id })
    });
  }
  return {
    redirect: {
      destination: `/${domain}/${firstPage.path}`,
      permanent: false
    }
  };
});

export default function IndexPage () {
  const [space] = useCurrentSpace();
  const [, setTitleState] = usePageTitle();
  const router = useRouter();

  useEffect(() => {
    if (space) {
      setTitleState(space.name);
    }
  }, [space]);

  return null;
}

IndexPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
