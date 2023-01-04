import type { Page } from '@prisma/client';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import CardDialog from 'components/common/BoardEditor/focalboard/src/components/cardDialog';
import CenterPanel from 'components/common/BoardEditor/focalboard/src/components/centerPanel';
import { FlashMessages, sendFlashMessage } from 'components/common/BoardEditor/focalboard/src/components/flashMessages';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import {
  getCurrentBoard,
  setCurrent as setCurrentBoard
} from 'components/common/BoardEditor/focalboard/src/store/boards';
import { useAppDispatch, useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { initialReadOnlyLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import {
  getCurrentBoardViews,
  getView,
  setCurrent as setCurrentView
} from 'components/common/BoardEditor/focalboard/src/store/views';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import FocalBoardPortal from 'components/common/BoardEditor/FocalBoardPortal';
import { useFocalboardViews } from 'hooks/useFocalboardViews';
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
  const [currentViewId, setCurrentViewId] = useState<string>(router.query.viewId as string);
  const activeView = useAppSelector(getView(currentViewId));
  const boardViews = useAppSelector(getCurrentBoardViews);
  const dispatch = useAppDispatch();
  const [shownCardId, setShownCardId] = useState<string | null>((router.query.cardId as string) ?? null);

  const { setFocalboardViewsRecord } = useFocalboardViews();

  const readOnlyBoard = readOnly || !pagePermissions?.edit_content;
  const readOnlyData = activeView?.fields?.sourceType === 'google_form'; // blocks that are synced cannot be edited

  useEffect(() => {
    const boardId = page.boardId;
    const urlViewId = router.query.viewId as string;

    // Ensure boardViews is for our boardId before redirecting
    const isCorrectBoardView = boardViews.length > 0 && boardViews[0].parentId === boardId;

    if (!urlViewId && isCorrectBoardView) {
      router.replace({
        pathname: router.pathname,
        query: {
          ...router.query,
          viewId: boardViews[0].id,
          cardId: router.query.cardId ?? ''
        }
      });
      return;
    }

    if (boardId) {
      dispatch(setCurrentBoard(boardId));
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
        if (description) {
          sendFlashMessage({ content: `Undo ${description}`, severity: 'low' });
        } else {
          sendFlashMessage({ content: 'Undo', severity: 'low' });
        }
      });
    } else {
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
        } else {
          sendFlashMessage({ content: 'Redu', severity: 'low' });
        }
      });
    } else {
      sendFlashMessage({ content: 'Nothing to Redo', severity: 'low' });
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
    (viewId) => {
      if (viewId === '') {
        // when creating an ew view for linked boards, user must select a source before the view exists
        // but we dont want to change the URL until the view is created
        setCurrentViewId('');
      } else {
        const { cardId, ...rest } = router.query;
        router.push(
          {
            pathname: router.pathname,
            query: {
              ...rest,
              viewId: viewId || ''
            }
          },
          undefined,
          { shallow: true }
        );
      }
    },
    [router.query]
  );

  if (board) {
    return (
      <>
        <FlashMessages milliseconds={2000} />
        <div className='focalboard-body full-page'>
          <CenterPanel
            readOnly={Boolean(readOnlyBoard)}
            readOnlyData={readOnlyData}
            board={board}
            setPage={setPage}
            pageIcon={page.icon}
            showCard={showCard}
            showView={showView}
            activeView={activeView || undefined}
            views={boardViews}
          />
          {typeof shownCardId === 'string' && shownCardId.length !== 0 && (
            <RootPortal>
              <CardDialog
                key={shownCardId}
                cardId={shownCardId}
                onClose={() => {
                  showCard(null);
                  setShownCardId(null);
                }}
                readOnly={readOnly}
              />
            </RootPortal>
          )}
        </div>
        {/** include the root portal for focalboard's popup */}
        <FocalBoardPortal />
      </>
    );
  }

  return null;
}
