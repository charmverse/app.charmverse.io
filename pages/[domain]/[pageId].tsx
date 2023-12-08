import { prisma } from '@charmverse/core/prisma-client';
import type { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

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
import { getPagePath } from 'lib/utilities/domains/getPagePath';
import { isUUID } from 'lib/utilities/strings';
import type { GlobalPageProps } from 'pages/_app';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { domain, pageId: pagePath } = ctx.params ?? {};

  if (typeof domain === 'string' && typeof pagePath === 'string') {
    const page = await prisma.page.findFirst({
      where: isUUID(pagePath)
        ? { id: pagePath }
        : {
            OR: [
              {
                path: pagePath
              },
              {
                additionalPaths: {
                  has: pagePath
                }
              }
            ],
            space: {
              OR: [
                {
                  domain
                },
                {
                  customDomain: domain,
                  isCustomDomainVerified: true
                }
              ]
            }
          },
      select: {
        title: true,
        path: true,
        contentText: true,
        type: true,
        space: {
          select: {
            paidTier: true,
            publicProposals: true,
            spaceImage: true
          }
        },
        permissions: {
          where: {
            public: true
          }
        }
      }
    });

    if (page) {
      if (page.path !== pagePath) {
        const sanitizedQuery = { ...ctx.query };
        // strip out parameters from the path
        delete sanitizedQuery.domain;
        delete sanitizedQuery.pageId;
        return {
          redirect: {
            destination: getPagePath({
              hostName: ctx.req.headers.host,
              path: page.path,
              query: sanitizedQuery,
              spaceDomain: domain
            }),
            permanent: false
          }
        };
        // Only disclose page meta if the page is public
      } else if (
        page.permissions.length > 0 ||
        page.space.paidTier === 'free' ||
        (page.type === 'proposal' && page.space.publicProposals)
      ) {
        return {
          props: {
            openGraphData: {
              title: page.title,
              description: page.contentText?.slice(0, 200),
              image: page.space?.spaceImage
            }
          } as Pick<GlobalPageProps, 'openGraphData'>
        };
      }
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
