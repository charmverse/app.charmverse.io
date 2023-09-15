import { prisma } from '@charmverse/core/prisma-client';
import type { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

import { EditorPage } from 'components/[pageId]/EditorPage/EditorPage';
import { SharedPage } from 'components/[pageId]/SharedPage/SharedPage';
import ErrorPage from 'components/common/errors/ErrorPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useSpaceSubscription } from 'components/settings/subscription/hooks/useSpaceSubscription';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { usePageIdFromPath } from 'hooks/usePageFromPath';
import { useSharedPage } from 'hooks/useSharedPage';
import { useUser } from 'hooks/useUser';
import { useWebSocketClient } from 'hooks/useWebSocketClient';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const pagePath = ctx.query.pageId as string;
  const domain = ctx.query.domain as string;

  if (pagePath && domain) {
    const pageRedirect = await prisma.page.findFirst({
      where: {
        additionalPaths: {
          has: pagePath
        },
        space: {
          domain
        }
      },
      select: {
        path: true
      }
    });

    if (pageRedirect && pageRedirect.path !== pagePath) {
      return {
        redirect: {
          destination: `/${domain}/${pageRedirect.path}`,
          permanent: false
        }
      };
    }
  }

  return {
    props: {}
  };
}
export default function PageView() {
  const { publicPage } = useSharedPage();
  const basePageId = usePageIdFromPath();
  const router = useRouter();
  const { isSpaceMember } = useIsSpaceMember();
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const { subscriptionEnded } = useSpaceSubscription();
  const { subscribe } = useWebSocketClient();
  useEffect(() => {
    const unsubscribe = subscribe('pages_meta_updated', (updates) => {
      const currentPath = router.query.pageId as string;
      const updatedPage = updates.find(
        (p) => p.id === basePageId || p.path === currentPath || p.additionalPaths?.includes(currentPath)
      );
      // eslint-disable-next-line no-console
      console.log(
        'PATH',
        currentPath,
        'BASE',
        basePageId,
        'QUERY',
        router.query.pageId,
        'UPDATED',
        updatedPage,
        'USER',
        user?.id
      );
      if (
        basePageId &&
        updatedPage &&
        user &&
        space &&
        updatedPage.additionalPaths?.includes(basePageId) &&
        updatedPage.path !== currentPath &&
        updatedPage.updatedBy === user?.id
      ) {
        // eslint-disable-next-line no-console
        console.log('Updating page path', router.pathname);
        router.replace(
          {
            pathname: router.pathname,
            query: {
              pageId: updatedPage.path,
              domain: router.query.domain
            }
          }
          // {
          //   pathname: router.pathname
          //   // query: {
          //   //   pageId: updatedPage.path,
          //   //   domain: space.domain
          //   // }
          // }
          //          { shallow: true }
        );
        // router.replace(router.pathname, `/${space.domain}/${updatedPage.path}`);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isSpaceMember && publicPage) {
    if (subscriptionEnded) {
      return <ErrorPage message='Sorry, looks like you do not have access to this page' />;
    }
    return <SharedPage publicPage={publicPage} />;
  }
  if (!basePageId) {
    return null;
  }

  return <EditorPage pageId={basePageId} />;
}

PageView.getLayout = getPageLayout;
