import { generatePath } from 'lib/utilities/strings';
import { Page } from 'models';
import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import CenterPanel from '../../common/BoardEditor/focalboard/src/components/centerPanel';
import { sendFlashMessage } from '../../common/BoardEditor/focalboard/src/components/flashMessages';
import mutator from '../../common/BoardEditor/focalboard/src/mutator';
import { getCurrentBoard, setCurrent as setCurrentBoard } from '../../common/BoardEditor/focalboard/src/store/boards';
import { getCurrentViewCardsSortedFilteredAndGrouped } from '../../common/BoardEditor/focalboard/src/store/cards';
import { getClientConfig } from '../../common/BoardEditor/focalboard/src/store/clientConfig';
import { useAppDispatch, useAppSelector } from '../../common/BoardEditor/focalboard/src/store/hooks';
import { initialLoad, initialReadOnlyLoad } from '../../common/BoardEditor/focalboard/src/store/initialLoad';
import { getCurrentBoardViews, getCurrentViewDisplayBy, getCurrentViewGroupBy, getView, setCurrent as setCurrentView } from '../../common/BoardEditor/focalboard/src/store/views';
import { Utils } from '../../common/BoardEditor/focalboard/src/utils';

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

  useEffect(() => {
    const boardId = page.boardId!;
    const urlViewId = router.query.viewId as string;

    // Ensure boardViews is for our boardId before redirecting
    const isCorrectBoardView = boardViews.length > 0 && boardViews[0].parentId === boardId;

    if (!urlViewId && isCorrectBoardView) {
      const newPath = generatePath(router.pathname, { ...router.query, boardId });
      router.replace({
        pathname: newPath,
        query: { viewId: boardViews[0].id, cardId: router.query.cardId }
      });
      return;
    }

    dispatch(setCurrentBoard(boardId));
    dispatch(setCurrentView(urlViewId || ''));

  }, [page.boardId, router.query.viewId, boardViews]);

  useEffect(() => {
    let loadAction: any = initialLoad; /* eslint-disable-line @typescript-eslint/no-explicit-any */
    let token = localStorage.getItem('focalboardSessionId') || '';
    if (readonly) {
      loadAction = initialReadOnlyLoad;
      token = token || router.query.r as string || '';
    }
    dispatch(loadAction(page.boardId));
  }, [router.query.spaceId, readonly, router.query.pageId]);

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

    router.push({ pathname: newPath, query }, undefined, { shallow: true });
  }, [router.query]);

  if (board && activeView) {
    let property = groupByProperty;
    if ((!property || property.type !== 'select') && activeView.fields.viewType === 'board') {
      property = board?.fields.cardProperties.find((o: any) => o.type === 'select');
    }

    let displayProperty = dateDisplayProperty;
    if (!displayProperty && activeView.fields.viewType === 'calendar') {
      displayProperty = board.fields.cardProperties.find((o: any) => o.type === 'date');
    }

    const viewsToProvide = readonly ? boardViews.filter(view => {
      return view.id === activeView.id;
    }) : boardViews;

    return (
      <div className='focalboard-body' style={{ flexGrow: 1 }}>
        <CenterPanel
          clientConfig={clientConfig}
          readonly={!!readonly}
          board={board}
          setPage={setPage}
          cards={cards}
          shownCardId={router.query.cardId as string}
          showCard={showCard}
          activeView={activeView}
          groupByProperty={property}
          dateDisplayProperty={displayProperty}
          views={viewsToProvide}
          showShared={clientConfig?.enablePublicSharedBoards || false}
        />
      </div>
    );
  }

  return null;
}
