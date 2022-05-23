// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { useFocalboardViews } from 'hooks/useFocalboardViews';
import { generatePath } from 'lib/utilities/strings';
import { useRouter } from 'next/router';
import React, { useCallback } from 'react';
import { injectIntl, IntlShape } from 'react-intl';
import { Block } from '../blocks/block';
import { Board } from '../blocks/board';
import { BoardView, createBoardView, IViewType } from '../blocks/boardView';
import mutator from '../mutator';
import { IDType, Utils } from '../utils';
import BoardIcon from '../widgets/icons/board';
import CalendarIcon from '../widgets/icons/calendar';
import DeleteIcon from '../widgets/icons/delete';
import DuplicateIcon from '../widgets/icons/duplicate';
import GalleryIcon from '../widgets/icons/gallery';
import TableIcon from '../widgets/icons/table';
import Menu from '../widgets/menu';


type Props = {
    board: Board,
    activeView: BoardView,
    views: BoardView[],
    intl: IntlShape
    readonly: boolean
}

export const iconForViewType = (viewType: IViewType) => {
  switch (viewType) {
  case 'board': return <BoardIcon/>
  case 'table': return <TableIcon/>
  case 'gallery': return <GalleryIcon/>
  case 'calendar': return <CalendarIcon/>
  default: return <div/>
  }
}
