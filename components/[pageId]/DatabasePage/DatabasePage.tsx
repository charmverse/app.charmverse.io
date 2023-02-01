import type { Page } from '@prisma/client';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import CardDialog from 'components/common/BoardEditor/focalboard/src/components/cardDialog';
import CenterPanel from 'components/common/BoardEditor/focalboard/src/components/centerPanel';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import {
  getCurrentBoard,
  setCurrent as setCurrentBoard
} from 'components/common/BoardEditor/focalboard/src/store/boards';
import { useAppDispatch, useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { initialReadOnlyLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import {
  getCurrentBoardViews,
  setCurrent as setCurrentView
} from 'components/common/BoardEditor/focalboard/src/store/views';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import FocalBoardPortal from 'components/common/BoardEditor/FocalBoardPortal';
import { useFocalboardViews } from 'hooks/useFocalboardViews';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PageMeta } from 'lib/pages';
import type { IPagePermissionFlags } from 'lib/permissions/pages';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

/**
 *
 * For the original version of this file, see src/boardPage.tsx in focalboard
 */

interface Props {
  page: PageMeta;
  readOnly?: boolean;
  setPage: (p: Partial<Page>) => void;
  pagePermissions?: IPagePermissionFlags;
}

export function DatabasePage({ page, setPage, readOnly = false, pagePermissions }: Props) {
  const router = useRouter();
  const board = useAppSelector(getCurrentBoard);
  const [currentViewId, setCurrentViewId] = useState<string | undefined>(router.query.viewId as string | undefined);
  const boardViews = useAppSelector(getCurrentBoardViews);
  // grab the first board view if current view is not specified
  const { showMessage } = useSnackbar();
  const activeView =
    typeof currentViewId === 'string' ? boardViews.find((view) => view.id === currentViewId) : boardViews[0];
  const dispatch = useAppDispatch();
  const [shownCardId, setShownCardId] = useState<string | null>((router.query.cardId as string) ?? null);

  const { setFocalboardViewsRecord } = useFocalboardViews();
  const readOnlyBoard = readOnly || !pagePermissions?.edit_content;
  const readOnlySourceData = activeView?.fields?.sourceType === 'google_form'; // blocks that are synced cannot be edited
  useEffect(() => {
    if (typeof router.query.cardId === 'string') {
      setShownCardId(router.query.cardId);
    }
  }, [router.query.cardId]);

  useEffect(() => {
    const boardId = page.boardId;
    const urlViewId = router.query.viewId as string;

    // Ensure boardViews is for our boardId before redirecting
    const firstBoardView = boardViews.find((view) => view.parentId === boardId);

    if (!urlViewId && firstBoardView) {
      router.replace({
        pathname: router.pathname,
        query: {
          ...router.query,
          viewId: firstBoardView.id,
          cardId: router.query.cardId ?? ''
        }
      });
      return;
    }

    if (boardId) {
      dispatch(setCurrentBoard(boardId));
      setCurrentViewId(urlViewId);
      // Note: current view in Redux is only used for search, which we currently are not using at the moment
      dispatch(setCurrentView(urlViewId || ''));
      setFocalboardViewsRecord((focalboardViewsRecord) => ({ ...focalboardViewsRecord, [boardId]: urlViewId }));
    }
  }, [page.boardId, router.query.viewId, boardViews]);

  // load initial data for readonly boards - otherwise its loaded in _app.tsx
  // inline linked board will be loaded manually
  useEffect(() => {
    if (readOnlyBoard && page.boardId && page.type !== 'inline_linked_board' && page.type !== 'linked_board') {
      dispatch(initialReadOnlyLoad(page.boardId));
    }
  }, [page.boardId]);

  useHotkeys('ctrl+z,cmd+z', () => {
    Utils.log('Undo');
    if (mutator.canUndo) {
      const description = mutator.undoDescription;
      mutator.undo().then(() => {
        showMessage(description ? `Undo ${description}` : 'Undo', 'success');
      });
    } else {
      showMessage('Nothing to Undo', 'info');
    }
  });

  useHotkeys('shift+ctrl+z,shift+cmd+z', () => {
    Utils.log('Redo');
    if (mutator.canRedo) {
      const description = mutator.redoDescription;
      mutator.redo().then(() => {
        showMessage(description ? `Redo ${description}` : 'Undo', 'success');
      });
    } else {
      showMessage('Nothing to Redo', 'info');
    }
  });

  const showCard = useCallback(
    (cardId: string | null = null) => {
      setUrlWithoutRerender(router.pathname, { viewId: router.query.viewId as string, cardId });
      setShownCardId(cardId);
    },
    [router.query]
  );

  const showView = useCallback(
    (viewId: string) => {
      if (viewId === '') {
        // when creating an ew view for linked boards, user must select a source before the view exists
        // but we dont want to change the URL until the view is created
        setCurrentViewId('');
      } else {
        const { cardId, ...rest } = router.query;
        router.push({
          pathname: router.pathname,
          query: {
            ...rest,
            viewId: viewId || ''
          }
        });
        // call setCurrentViewId in case user clicked "add view", because we didnt update the URL so it wouldnt affect the activeView
        setCurrentViewId(viewId);
      }
    },
    [router.query]
  );

  if (board) {
    return (
      <>
        <div className='focalboard-body full-page'>
          <CenterPanel
            readOnly={Boolean(readOnlyBoard)}
            readOnlySourceData={readOnlySourceData}
            board={board}
            setPage={setPage}
            pageIcon={page.icon}
            showCard={showCard}
            showView={showView}
            activeView={activeView || undefined}
            views={boardViews}
          />
          {typeof shownCardId === 'string' && shownCardId.length !== 0 && (
            <CardDialog
              key={shownCardId}
              cardId={shownCardId}
              onClose={() => {
                showCard(null);
              }}
              readOnly={readOnly}
            />
          )}
        </div>
        {/** include the root portal for focalboard's popup */}
        <FocalBoardPortal />
      </>
    );
  }

  return null;
}
