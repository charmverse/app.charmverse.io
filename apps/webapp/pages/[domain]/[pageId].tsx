import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { setUrlWithoutRerender } from '@packages/lib/utils/browser';
import { getCanonicalURL } from '@packages/lib/utils/domains/getCanonicalURL';
import { getCustomDomainFromHost } from '@packages/lib/utils/domains/getCustomDomainFromHost';
import { getPagePath } from '@packages/lib/utils/domains/getPagePath';
import { isUUID } from '@packages/utils/strings';
import type { GetServerSidePropsContext } from 'next';
import { useEffect } from 'react';

import { EditorPage } from 'components/[pageId]/EditorPage/EditorPage';
import { SharedPage } from 'components/[pageId]/SharedPage/SharedPage';
import ErrorPage from 'components/common/errors/ErrorPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useSpaceSubscription } from 'components/settings/subscription/hooks/useSpaceSubscription';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { usePageIdFromPath } from 'hooks/usePageFromPath';
import { useSharedPage } from 'hooks/useSharedPage';
import { useUser } from 'hooks/useUser';
import { useWebSocketClient } from 'hooks/useWebSocketClient';
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
            customDomain: true,
            domain: true,
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
        const destination = getPagePath({
          hostName: ctx.req.headers.host,
          path: page.path,
          query: sanitizedQuery as Record<string, string | null | undefined>,
          spaceDomain: domain
        });
        log.info('Redirecting to latest page path', {
          destination,
          hostName: ctx.req.headers.host,
          newPath: page.path,
          domain,
          pagePath
        });
        return {
          redirect: {
            destination,
            permanent: false
          }
        };
        // Only disclose page meta if the page is public
      } else if (
        page.permissions.length > 0 ||
        page.space.paidTier === 'free' ||
        (page.type === 'proposal' && page.space.publicProposals)
      ) {
        const canonicalUrl = getCanonicalURL({
          req: ctx.req,
          path: page.path,
          spaceDomain: page.space.domain,
          spaceCustomDomain: page.space.customDomain
        });
        return {
          props: {
            openGraphData: {
              title: page.title,
              description: page.contentText?.slice(0, 200),
              image: page.space?.spaceImage,
              canonicalUrl
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
  const { router, clearURLQuery, updateURLQuery } = useCharmRouter();
  const { isSpaceMember } = useIsSpaceMember();
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const { isSpaceReadonly } = useSpaceSubscription();
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

  useEffect(() => {
    // reload is used by new proposal endpoint. see pages/[domain]/proposals/new.tsx
    if (router.query.reload) {
      setTimeout(() => {
        window.location.search = '';
      }, 0);
    }
  }, [router.query.reload, clearURLQuery]);

  if (!isSpaceMember && publicPage) {
    return <SharedPage publicPage={publicPage} />;
  }
  if (!basePageId) {
    return null;
  }

  return <EditorPage pageId={basePageId} />;
}

PageView.getLayout = getPageLayout;
