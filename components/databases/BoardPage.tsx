import React, { useCallback, useEffect } from 'react';
import { generatePath } from 'lib/strings';
import { Page } from 'models';
import { useRouter } from 'next/router';
import { getCurrentBoard } from './focalboard/src/store/boards';
import { getCurrentViewCardsSortedFilteredAndGrouped } from './focalboard/src/store/cards';
import { getView, getCurrentBoardViews, getCurrentViewGroupBy, getCurrentView, getCurrentViewDisplayBy } from './focalboard/src/store/views';
import { useAppSelector, useAppDispatch } from './focalboard/src/store/hooks';

import { getClientConfig, setClientConfig } from './focalboard/src/store/clientConfig';

import { ClientConfig } from './focalboard/src/config/clientConfig';
import { Utils } from './focalboard/src/utils';

import CenterPanel from './focalboard/src/components/centerPanel';
import EmptyCenterPanel from './focalboard/src/components/emptyCenterPanel';
import { initialLoad, initialReadOnlyLoad } from './focalboard/src/store/initialLoad';

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

  useEffect(() => {
    let loadAction: any = initialLoad; /* eslint-disable-line @typescript-eslint/no-explicit-any */
    let token = localStorage.getItem('focalboardSessionId') || '';
    if (readonly) {
      loadAction = initialReadOnlyLoad;
      token = token || router.query.r as string || '';
    }

    dispatch(loadAction(router.query.pageId));

  }, [router.query.workspaceId, readonly, router.query.pageId]);

  const showCard = useCallback((cardId?: string) => {
    const params = { ...router.query, cardId };
    let newPath = generatePath(router.pathname, params);
    if (readonly) {
      newPath += `?r=${Utils.getReadToken()}`;
    }
    router.push(newPath);
  }, [router.query]);

  console.log('BOARD AND VIEW', board, activeView);

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
      <div className='focalboard-body'>
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
