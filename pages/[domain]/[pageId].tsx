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
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import { getCustomDomainFromHost } from 'lib/utilities/domains/getCustomDomainFromHost';

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
      // Since we perform a shallow replace, we need the mask value of the browser url
      const displayedPath = window.history.state.as?.split('/') as string[];
      const currentPath = displayedPath?.[displayedPath.length - 1] as string;

      const updatedPage = updates.find(
        (p) => p.id === basePageId || p.path === currentPath || p.additionalPaths?.includes(currentPath)
      );

      if (
        currentPath &&
        updatedPage &&
        user &&
        space &&
        updatedPage.path !== currentPath &&
        updatedPage.additionalPaths?.includes(currentPath) &&
        updatedPage.updatedBy === user?.id
      ) {
        const customDomain = getCustomDomainFromHost();
        // eslint-disable-next-line no-console
        console.log('Updating page path', router.pathname);
        setUrlWithoutRerender(
          router.pathname,
          {},
          customDomain ? `/${updatedPage.path}` : `/${space.domain}/${updatedPage.path}`
        );
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
