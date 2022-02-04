import { useCallback, useEffect } from 'react';
import { batch } from 'react-redux';
import { generatePath } from 'lib/strings';
import { useRouter } from 'next/router';
import { getView, getCurrentBoardViews, getCurrentViewGroupBy, updateViews, getCurrentViewDisplayBy } from './focalboard/src/store/views';
import { useAppSelector, useAppDispatch } from './focalboard/src/store/hooks';
import wsClient, { WSClient } from './focalboard/src/wsclient';
import { updateBoards, getCurrentBoard } from './focalboard/src/store/boards';
import { updateCards, getCurrentViewCardsSortedFilteredAndGrouped } from './focalboard/src/store/cards';
import { updateContents } from './focalboard/src/store/contents';
import { updateComments } from './focalboard/src/store/comments';
import { Block } from './focalboard/src/blocks/block';
import { ContentBlock } from './focalboard/src/blocks/contentBlock';
import { CommentBlock } from './focalboard/src/blocks/commentBlock';
import { Board } from './focalboard/src/blocks/board';
import { Card } from './focalboard/src/blocks/card';
import { BoardView } from './focalboard/src/blocks/boardView';
import { getClientConfig } from './focalboard/src/store/clientConfig';
import { Utils } from './focalboard/src/utils';
import CenterPanel from './focalboard/src/components/centerPanel';
import EmptyCenterPanel from './focalboard/src/components/emptyCenterPanel';
import { initialLoad, initialReadOnlyLoad } from './focalboard/src/store/initialLoad';

/**
 *
 * For the original version of this file, see src/boardPage.tsx in focalboard
 */

interface Props {
  // page: Page;
  readonly?: boolean;
  // setPage: (p: Page) => void;
}

export function DatabaseEditor ({ readonly }: Props) {
  const router = useRouter();
  const board = useAppSelector(getCurrentBoard);
  const cards = useAppSelector(getCurrentViewCardsSortedFilteredAndGrouped);
  const activeView = useAppSelector(getView(router.query.viewId as string));
  const views = useAppSelector(getCurrentBoardViews);
  const groupByProperty = useAppSelector(getCurrentViewGroupBy);
  const dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy);
  const clientConfig = useAppSelector(getClientConfig);
  const dispatch = useAppDispatch();

  const spaceId = router.query.workspaceId;

  useEffect(() => {
    let loadAction: any = initialLoad; /* eslint-disable-line @typescript-eslint/no-explicit-any */
    let token = localStorage.getItem('focalboardSessionId') || '';
    if (readonly) {
      loadAction = initialReadOnlyLoad;
      token = token || router.query.r as string || '';
    }

    dispatch(loadAction(router.query.pageId));

    const incrementalUpdate = (_: WSClient, blocks: Block[]) => {
      // only takes into account the blocks that belong to the workspace
      const workspaceBlocks = blocks.filter((b: Block) => b.workspaceId === '0' || b.workspaceId === spaceId);

      batch(() => {
        dispatch(updateBoards(workspaceBlocks.filter((b: Block) => b.type === 'board' || b.deleteAt !== 0) as Board[]));
        dispatch(updateViews(workspaceBlocks.filter((b: Block) => b.type === 'view' || b.deleteAt !== 0) as BoardView[]));
        dispatch(updateCards(workspaceBlocks.filter((b: Block) => b.type === 'card' || b.deleteAt !== 0) as Card[]));
        dispatch(updateComments(workspaceBlocks.filter((b: Block) => b.type === 'comment' || b.deleteAt !== 0) as CommentBlock[]));
        dispatch(updateContents(workspaceBlocks.filter((b: Block) => b.type !== 'card' && b.type !== 'view' && b.type !== 'board' && b.type !== 'comment') as ContentBlock[]));
      });
    };

    wsClient.addOnChange(incrementalUpdate);

    return () => {
      wsClient.removeOnChange(incrementalUpdate);
    };

  }, [router.query.workspaceId, readonly, router.query.pageId]);

  const showCard = useCallback((cardId?: string) => {
    let newPath = generatePath(router.pathname, router.query);
    if (readonly) {
      newPath += `?r=${Utils.getReadToken()}`;
    }
    router.push({ pathname: newPath, query: { cardId } }, undefined, { shallow: true });
  }, [router.query]);

  if (board && activeView) {
    let property = groupByProperty;
    if ((!property || property.type !== 'select') && activeView.fields.viewType === 'board') {
      property = board?.fields.cardProperties.find((o) => o.type === 'select');
    }

    let displayProperty = dateDisplayProperty;
    if (!displayProperty && activeView.fields.viewType === 'calendar') {
      displayProperty = board.fields.cardProperties.find((o) => o.type === 'date');
    }

    return (
      <div className='focalboard-body' style={{ flexGrow: 1 }}>
        <CenterPanel
          clientConfig={clientConfig}
          readonly={!!readonly}
          board={board}
          cards={cards}
          shownCardId={router.query.cardId as string}
          showCard={showCard}
          activeView={activeView}
          groupByProperty={property}
          dateDisplayProperty={displayProperty}
          views={views}
          showShared={clientConfig?.enablePublicSharedBoards || false}
        />
      </div>
    );
  }

  return (
    <EmptyCenterPanel />
  );
}

// const Workspace = React.memo((props: Props) => {
//     const board = useAppSelector(getCurrentBoard)
//     const view = useAppSelector(getCurrentView)

//     return (
//         <div className='Workspace'>
//             {!props.readonly &&
//                 <Sidebar
//                     activeBoardId={board?.id}
//                     activeViewId={view?.id}
//                 />
//             }
//             <div className='mainFrame'>
//                 {(board?.fields.isTemplate) &&
//                 <div className='banner'>
//                     <FormattedMessage
//                         id='Workspace.editing-board-template';
//                         defaultMessage="You're editing a board template."
//                     />
//                 </div>}
//                 <CenterContent
//                     readonly={props.readonly}
//                 />
//             </div>
//         </div>
//     )
// })

// export default Workspace
