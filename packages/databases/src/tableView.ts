import type { IntlShape } from 'react-intl';

import type { Board, DataSourceType, IPropertyTemplate } from './board';
import type { BoardView } from './boardView';
import { createBoardView } from './boardView';
import { Constants } from './constants';

type CreateViewProps = {
  board: Board;
  activeView?: BoardView;
  intl?: IntlShape;
  dataSourceType?: DataSourceType;
};

export function createTableView({ board, activeView, dataSourceType }: CreateViewProps) {
  const view = createBoardView(activeView);
  view.title = '';
  view.fields.viewType = 'table';
  view.parentId = board.id;
  view.rootId = board.rootId;
  view.fields.visiblePropertyIds = board.fields.cardProperties.map((o: IPropertyTemplate) => o.id);
  view.fields.columnWidths = {};
  view.fields.columnWidths[Constants.titleColumnId] = Constants.defaultTitleColumnWidth;
  view.fields.cardOrder = activeView?.fields.cardOrder ?? [];
  view.fields.sourceType = dataSourceType;
  return view;
}
