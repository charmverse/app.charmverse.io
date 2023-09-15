import { prisma } from '@charmverse/core/prisma-client';
import type { GetServerSidePropsContext } from 'next';

import { EditorPage } from 'components/[pageId]/EditorPage/EditorPage';
import { SharedPage } from 'components/[pageId]/SharedPage/SharedPage';
import ErrorPage from 'components/common/errors/ErrorPage';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { useSpaceSubscription } from 'components/settings/subscription/hooks/useSpaceSubscription';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { usePageIdFromPath } from 'hooks/usePageFromPath';
import { useSharedPage } from 'hooks/useSharedPage';
import type { GlobalPageProps } from 'pages/_app';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const url = ctx.resolvedUrl?.split('/') ?? [];

  const domain = url[1];
  const pagePath = url[2];

  if (domain && pagePath) {
    const page = await prisma.page.findFirst({
      where: {
        path: pagePath,
        permissions: {
          some: {
            public: true
          }
        },
        space: {
          OR: [
            {
              domain
            },
            {
              customDomain: domain
            }
          ]
        }
      },
      select: {
        title: true,
        contentText: true,
        space: {
          select: {
            spaceImage: true
          }
        }
      }
    });

    if (page) {
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

  return {
    props: {}
  };
}

export default function PageView() {
  const { publicPage } = useSharedPage();
  const basePageId = usePageIdFromPath();
  const { isSpaceMember } = useIsSpaceMember();
  const { subscriptionEnded } = useSpaceSubscription();

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
