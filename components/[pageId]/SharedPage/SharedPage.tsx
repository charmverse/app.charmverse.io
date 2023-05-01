import { useEffect } from 'react';

import charmClient from 'charmClient';
import { DatabasePage } from 'components/[pageId]/DatabasePage';
import DocumentPage from 'components/[pageId]/DocumentPage';
import { updateBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { addCard } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { addView, setCurrent } from 'components/common/BoardEditor/focalboard/src/store/views';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import { useBounties } from 'hooks/useBounties';
import { useCurrentPage } from 'hooks/useCurrentPage';
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
  const [, setTitleState] = usePageTitle();

  const basePageId = publicPage?.page?.id || '';

  const { setBounties, loadingBounties } = useBounties();

  // Pre-populate bounties state in place of prop drilling
  useEffect(() => {
    if (publicPage?.bounty && !loadingBounties) {
      setBounties([publicPage.bounty]);
    }
  }, [publicPage, loadingBounties]);

  async function onLoad() {
    if (!publicPage) {
      return;
    }

    const { page: rootPage, cards, boards, views } = publicPage;

    charmClient.track.trackAction('page_view', {
      type: rootPage.type,
      pageId: rootPage.id,
      spaceId: rootPage.spaceId
    });

    setTitleState(rootPage.title);
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
    if (publicPage) {
      onLoad();
    }

    return () => {
      setCurrentPageId('');
    };
  }, [publicPage]);

  const currentPage = pages?.[basePageId];

  if (!currentPage && publicPage) {
    return <LoadingComponent isLoading />;
  }

  if (!currentPage) {
    return <ErrorPage message='Sorry, looks like you do not have access to this page' />;
  }

  return currentPage.type.match(/board/) ? (
    <DatabasePage page={currentPage} setPage={() => null} readOnly={true} />
  ) : (
    <DocumentPage page={publicPage.page} refreshPage={() => Promise.resolve()} savePage={() => null} readOnly={true} />
  );
}
