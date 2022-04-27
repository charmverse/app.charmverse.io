import { generatePath } from 'lib/utilities/strings';
import { Page } from 'models';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import CenterPanel from 'components/common/BoardEditor/focalboard/src/components/centerPanel';
import { sendFlashMessage } from 'components/common/BoardEditor/focalboard/src/components/flashMessages';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { getCurrentBoard, setCurrent as setCurrentBoard } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { getCurrentViewCardsSortedFilteredAndGrouped } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { getClientConfig } from 'components/common/BoardEditor/focalboard/src/store/clientConfig';
import { useAppDispatch, useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { initialReadOnlyLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import { getCurrentBoardViews, getCurrentViewDisplayBy, getCurrentViewGroupBy, getView, setCurrent as setCurrentView } from 'components/common/BoardEditor/focalboard/src/store/views';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import CardDialog from 'components/common/BoardEditor/focalboard/src/components/cardDialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import { silentlyUpdateURL } from 'lib/browser';
import { usePages } from 'hooks/usePages';

/**
 *
 * For the original version of this file, see src/boardPage.tsx in focalboard
 */

interface Props {
  page: Page;
  readonly?: boolean;
  setPage: (p: Partial<Page>) => void;
}

export default function BoardPage ({ page, setPage, readonly }: Props) {
  const router = useRouter();
  const board = useAppSelector(getCurrentBoard);
  const cards = useAppSelector(getCurrentViewCardsSortedFilteredAndGrouped);
  const activeView = useAppSelector(getView(router.query.viewId as string));
  const boardViews = useAppSelector(getCurrentBoardViews);
  const groupByProperty = useAppSelector(getCurrentViewGroupBy);
  const dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy);
  const clientConfig = useAppSelector(getClientConfig);
  const dispatch = useAppDispatch();
  const [shownCardId, setShownCardId] = useState(router.query.cardId);
  const { pages } = usePages();
  const accessibleCards = useMemo(() => cards.filter(card => pages[card.id]), [cards, Object.keys(pages).toString()]);

  useEffect(() => {
    const boardId = page.boardId!;
    const urlViewId = router.query.viewId as string;

    // Ensure boardViews is for our boardId before redirecting
    const isCorrectBoardView = boardViews.length > 0 && boardViews[0].parentId === boardId;

    if (!urlViewId && isCorrectBoardView) {
      const newPath = generatePath(router.pathname, { ...router.query, boardId });
      router.replace({
        pathname: newPath,
        query: { viewId: boardViews[0].id, cardId: shownCardId }
      });
      return;
    }

    dispatch(setCurrentBoard(boardId));
    dispatch(setCurrentView(urlViewId || ''));

  }, [page.boardId, router.query.viewId, boardViews]);

  // load initial data for readonly boards - otherwise its loaded in _app.tsx
  useEffect(() => {
    if (readonly && page.boardId) {
      dispatch(initialReadOnlyLoad(page.boardId));
    }
  }, [page.boardId]);

  useHotkeys('ctrl+z,cmd+z', () => {
    Utils.log('Undo');
    if (mutator.canUndo) {
      const description = mutator.undoDescription;
      mutator.undo().then(() => {
        if (description) {
          sendFlashMessage({ content: `Undo ${description}`, severity: 'low' });
        }
        else {
          sendFlashMessage({ content: 'Undo', severity: 'low' });
        }
      });
    }
    else {
      sendFlashMessage({ content: 'Nothing to Undo', severity: 'low' });
    }
  });

  useHotkeys('shift+ctrl+z,shift+cmd+z', () => {
    Utils.log('Redo');
    if (mutator.canRedo) {
      const description = mutator.redoDescription;
      mutator.redo().then(() => {
        if (description) {
          sendFlashMessage({ content: `Redo ${description}`, severity: 'low' });
        }
        else {
          sendFlashMessage({ content: 'Redu', severity: 'low' });
        }
      });
    }
    else {
      sendFlashMessage({ content: 'Nothing to Redo', severity: 'low' });
    }
  });

  const showCard = useCallback((cardId?: string) => {
    const newPath = generatePath(router.pathname, router.query);

    const query: any = { cardId, viewId: router.query.viewId };

    if (readonly) {
      query.r = Utils.getReadToken();
    }
    const newUrl = `${newPath}?${new URLSearchParams(query).toString()}`;
    silentlyUpdateURL(newUrl);
    setShownCardId(cardId);
  }, [router.query]);

  const viewsToProvide = readonly ? boardViews.filter(view => {
    return view.id === activeView?.id;
  }) : boardViews;

  if (board && activeView) {
    let property = groupByProperty;
    if ((!property || property.type !== 'select') && activeView.fields.viewType === 'board') {
      property = board?.fields.cardProperties.find((o: any) => o.type === 'select');
    }

    let displayProperty = dateDisplayProperty;
    if (!displayProperty && activeView.fields.viewType === 'calendar') {
      displayProperty = board.fields.cardProperties.find((o: any) => o.type === 'date');
    }

    return (
      <div className='focalboard-body' style={{ flexGrow: 1 }}>
        <CenterPanel
          clientConfig={clientConfig}
          readonly={!!readonly}
          board={board}
          setPage={setPage}
          cards={accessibleCards}
          showCard={showCard}
          activeView={activeView}
          groupByProperty={property}
          dateDisplayProperty={displayProperty}
          views={viewsToProvide}
          showShared={clientConfig?.enablePublicSharedBoards || false}
        />
        {typeof shownCardId === 'string' && (
          <RootPortal>
            <CardDialog
              board={board}
              activeView={activeView}
              views={viewsToProvide}
              cards={accessibleCards}
              key={shownCardId}
              cardId={shownCardId}
              onClose={() => showCard(undefined)}
              showCard={(cardId) => showCard(cardId)}
              readonly={!!readonly}
            />
          </RootPortal>
        )}
      </div>
    );
  }

  return null;
}
