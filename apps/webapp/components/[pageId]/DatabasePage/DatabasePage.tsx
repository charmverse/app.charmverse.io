import type { PageMeta } from '@charmverse/core/pages';
import type { PagePermissionFlags } from '@charmverse/core/permissions';
import type { Page } from '@charmverse/core/prisma';
import type { Board } from '@packages/databases/board';
import mutator from '@packages/databases/mutator';
import { getCurrentBoard, setCurrent as setCurrentBoard } from '@packages/databases/store/boards';
import { initialDatabaseLoad, databaseViewsLoad, blockLoad } from '@packages/databases/store/databaseBlocksLoad';
import { useAppDispatch, useAppSelector } from '@packages/databases/store/hooks';
import { getCurrentBoardViews, setCurrent as setCurrentView } from '@packages/databases/store/views';
import { Utils } from '@packages/databases/utils';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import CenterPanel from 'components/common/DatabaseEditor/components/centerPanel';
import DatabasePortal from 'components/common/DatabaseEditor/DatabasePortal';
import { PageDialog } from 'components/common/PageDialog/PageDialog';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useDatabaseViews } from 'hooks/useDatabaseViews';
import { DbViewSettingsProvider } from 'hooks/useLocalDbViewSettings';
import { useSnackbar } from 'hooks/useSnackbar';

/**
 *
 * For the original version of this file, see src/boardPage.tsx in focalboard
 */

interface Props {
  page: PageMeta;
  readOnly?: boolean;
  setPage: (p: Partial<Page>) => void;
  pagePermissions?: PagePermissionFlags;
}

export function DatabasePage({ page, setPage, readOnly = false, pagePermissions }: Props) {
  const router = useRouter();
  const board = useAppSelector(getCurrentBoard) as Board | undefined; // TODO: why do types from getCurrentBoard not include undefined

  const boardViews = useAppSelector(getCurrentBoardViews);
  // grab the first board view if current view is not specified
  const { showMessage } = useSnackbar();
  const currentViewId = router.query.viewId as string | undefined;
  const activeView = boardViews.find((view) => view.id === currentViewId) ?? boardViews[0];
  const dispatch = useAppDispatch();
  const [shownCardId, setShownCardId] = useState<string | null>((router.query.cardId as string) ?? null);
  const { updateURLQuery, navigateToSpacePath } = useCharmRouter();
  const { setViewsRecord } = useDatabaseViews();
  const readOnlyBoard = readOnly || !pagePermissions?.edit_content;

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
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            viewId: firstBoardView.id,
            cardId: router.query.cardId ?? ''
          }
        },
        undefined,
        { shallow: true }
      );
      return;
    }

    if (boardId) {
      dispatch(setCurrentBoard(boardId));
      // Note: current view in Redux is only used for search, which we currently are not using at the moment
      dispatch(setCurrentView(urlViewId || ''));
      setViewsRecord((record) => ({ ...record, [boardId]: urlViewId }));
    }
  }, [page.boardId, boardViews]);

  // load initial data for readonly boards - otherwise its loaded in _app.tsx
  // inline linked board will be loaded manually
  useEffect(() => {
    if (page.id && (!board || page.id !== board.id)) {
      dispatch(initialDatabaseLoad({ pageId: page.id }));
      // extra call to load the board and views as it takes less time when u have lots of cards
      dispatch(blockLoad({ blockId: page.id }));
      dispatch(databaseViewsLoad({ pageId: page.id as string }));
    } else if (board?.fields.sourceType === 'proposals' && board.id === page.id) {
      // always refresh proposal source board
      dispatch(initialDatabaseLoad({ pageId: page.id }));
    }
  }, [board?.id, page.id]);

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
    async (
      cardId: string | null,
      isTemplate?: boolean,
      event?: React.MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
    ) => {
      if (cardId === null) {
        updateURLQuery({ cardId: null });
        setShownCardId(null);
        return;
      }

      if (activeView.fields.openPageIn === 'center_peek' || isTemplate) {
        event?.preventDefault();
        updateURLQuery({ viewId: router.query.viewId as string, cardId });
        setShownCardId(cardId);
      } else if (activeView.fields.openPageIn === 'full_page') {
        navigateToSpacePath(`/${cardId}`);
      }
    },
    [router.query, activeView]
  );

  const showView = useCallback(
    (viewId: string) => {
      const { cardId, ...rest } = router.query;
      router.replace({
        pathname: router.pathname,
        query: {
          ...rest,
          viewId: viewId || ''
        }
      });
    },
    [router.query]
  );

  if (!board) {
    return null;
  }

  return (
    <>
      <div data-test='database-page' className='focalboard-body full-page'>
        <DbViewSettingsProvider>
          <CenterPanel
            currentRootPageId={page.id}
            readOnly={Boolean(readOnlyBoard)}
            board={board}
            setPage={setPage}
            pageIcon={page.icon}
            showCard={showCard}
            showView={showView}
            activeView={activeView || undefined}
            views={boardViews}
            page={page}
          />
          {typeof shownCardId === 'string' && shownCardId.length !== 0 && (
            <PageDialog
              showCard={showCard}
              key={shownCardId}
              pageId={shownCardId}
              onClose={() => {
                showCard(null);
              }}
              currentBoardId={board.id}
              readOnly={readOnly}
            />
          )}
        </DbViewSettingsProvider>
      </div>
      {/** include the root portal for focalboard's popup */}
      <DatabasePortal />
    </>
  );
}
