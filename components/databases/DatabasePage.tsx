import { generatePath } from 'lib/strings';
import { Page } from 'models';
import { useRouter } from 'next/router';
import { useCallback, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import CenterPanel from './focalboard/src/components/centerPanel';
import { sendFlashMessage } from './focalboard/src/components/flashMessages';
import mutator from './focalboard/src/mutator';
import { getCurrentBoard, setCurrent as setCurrentBoard } from './focalboard/src/store/boards';
import { getCurrentViewCardsSortedFilteredAndGrouped } from './focalboard/src/store/cards';
import { getClientConfig } from './focalboard/src/store/clientConfig';
import { useAppDispatch, useAppSelector } from './focalboard/src/store/hooks';
import { initialLoad, initialReadOnlyLoad } from './focalboard/src/store/initialLoad';
import { getCurrentBoardViews, getCurrentViewDisplayBy, getCurrentViewGroupBy, getView, setCurrent as setCurrentView } from './focalboard/src/store/views';
import { Utils } from './focalboard/src/utils';

/**
 *
 * For the original version of this file, see src/boardPage.tsx in focalboard
 */

interface Props {
  page: Page;
  readonly?: boolean;
  setPage: (p: Partial<Page>) => void;
}

export function DatabaseEditor ({ page, setPage, readonly }: Props) {
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
    const viewId = router.query.viewId as string;

    // Ensure boardViews is for our boardId before redirecting
    const isCorrectBoardView = boardViews.length > 0 && boardViews[0].parentId === boardId;
    if (!viewId && isCorrectBoardView) {
      const newPath = generatePath(router.pathname, { ...router.query, boardId });
      router.replace({
        pathname: newPath,
        query: { viewId: boardViews[0].id }
      });
      return;
    }

    dispatch(setCurrentBoard(boardId));
    dispatch(setCurrentView(viewId || ''));

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
    let newPath = generatePath(router.pathname, router.query);
    if (readonly) {
      newPath += `?r=${Utils.getReadToken()}`;
    }
    router.push({ pathname: newPath, query: { cardId, viewId: router.query.viewId } }, undefined, { shallow: true });
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
          views={boardViews}
          showShared={clientConfig?.enablePublicSharedBoards || false}
        />
      </div>
    );
  }

  return null;
}
