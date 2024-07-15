import { Box } from '@mui/material';
import { useEffect } from 'react';

import charmClient from 'charmClient';
import { trackPageView } from 'charmClient/hooks/track';
import { DatabasePage } from 'components/[pageId]/DatabasePage';
import { DocumentPageWithSidebars } from 'components/[pageId]/DocumentPage/DocumentPageWithSidebars';
import { updateBoards } from 'components/common/DatabaseEditor/store/boards';
import { addCard } from 'components/common/DatabaseEditor/store/cards';
import { useAppDispatch } from 'components/common/DatabaseEditor/store/hooks';
import { addView, setCurrent } from 'components/common/DatabaseEditor/store/views';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCurrentPage } from 'hooks/useCurrentPage';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import type { PublicPageResponse } from 'lib/pages/interfaces';

type Props = {
  publicPage: PublicPageResponse;
};

export function SharedPage({ publicPage }: Props) {
  const dispatch = useAppDispatch();
  const { setCurrentPageId } = useCurrentPage();
  const { pages } = usePages();
  const [, setPageTitle] = usePageTitle();
  const { space } = useCurrentSpace();

  const basePageId = publicPage?.page?.id || '';

  const { isLoading: isLoadingRewards, mutateRewards: refreshRewards } = useRewards();

  // Pre-populate bounties state in place of prop drilling
  useEffect(() => {
    if (publicPage?.bounty && !isLoadingRewards) {
      refreshRewards([publicPage.bounty]);
    }
  }, [publicPage, isLoadingRewards]);

  async function onLoad(_publicPage: PublicPageResponse, spaceDomain: string, spaceCustomDomain: string | null) {
    const { page: rootPage, cards, boards, views } = _publicPage;

    trackPageView({
      type: rootPage.type,
      pageId: rootPage.id,
      spaceId: rootPage.spaceId,
      spaceDomain,
      spaceCustomDomain
    });

    if (space?.domain === 'op-grants') {
      charmClient.track.trackActionOp('page_view', {
        type: rootPage.type,
        path: rootPage.path,
        url: window.location.href
      });
    }

    setPageTitle(rootPage.title);
    setCurrentPageId(rootPage.id);

    dispatch(setCurrent(rootPage.id));
    cards.forEach((card) => {
      dispatch(addCard(card));
    });

    views.forEach((view) => {
      dispatch(addView(view));
    });

    dispatch(updateBoards(boards));
  }

  useEffect(() => {
    if (publicPage && space) {
      onLoad(publicPage, space.domain, space.customDomain);
    }

    return () => {
      setCurrentPageId('');
    };
  }, [publicPage?.page.id, !!space]);

  const currentPage = publicPage?.page ?? pages?.[basePageId];

  if (!currentPage && publicPage) {
    return <LoadingComponent isLoading />;
  }

  if (!currentPage) {
    return <ErrorPage message='Sorry, looks like you do not have access to this page' />;
  }

  return currentPage.type.match(/board/) ? (
    <DatabasePage page={currentPage} setPage={() => null} readOnly />
  ) : (
    <Box display='flex' flexGrow={1} minHeight={0} /** add minHeight so that flexGrow expands to correct heigh */>
      <DocumentPageWithSidebars page={publicPage.page} savePage={() => null} readOnly />
    </Box>
  );
}
