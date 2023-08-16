import type { IntlShape } from 'react-intl';

import { Constants } from 'components/common/BoardEditor/focalboard/src/constants';

import type { Board, IPropertyTemplate } from './board';
import type { BoardView, ViewSourceType } from './boardView';
import { createBoardView } from './boardView';

type CreateViewProps = {
  board: Board;
  views: BoardView[];
  activeView?: BoardView;
  intl?: IntlShape;
  dataSourceType?: ViewSourceType;
};

export function createTableView({ board, activeView, dataSourceType, views }: CreateViewProps) {
  const view = createBoardView(activeView);
  view.title = '';
  view.fields.viewType = 'table';
  view.parentId = board.id;
  view.rootId = board.rootId;
  view.fields.visiblePropertyIds = board.fields.cardProperties.map((o: IPropertyTemplate) => o.id);
  view.fields.columnWidths = {};
  view.fields.columnWidths[Constants.titleColumnId] = Constants.defaultTitleColumnWidth;
  view.fields.cardOrder = activeView?.fields.cardOrder ?? [];
  view.fields.sourceType = views.some((v) => v.fields.sourceType === 'proposals') ? 'proposals' : dataSourceType;

  return view;
}
