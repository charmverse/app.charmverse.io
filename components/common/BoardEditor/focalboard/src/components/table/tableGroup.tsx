/* eslint-disable max-lines */
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import React from 'react';
import { useDrop } from 'react-dnd';

import type { PageListItemsRecord } from 'components/common/BoardEditor/interfaces';
import type { Board, IPropertyOption, IPropertyTemplate, BoardGroup } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';

import TableGroupHeaderRow from './tableGroupHeaderRow';
import TableRows from './tableRows';

type Props = {
  board: Board;
  activeView: BoardView;
  groupByProperty?: IPropertyTemplate;
  group: BoardGroup;
  readOnly: boolean;
  columnRefs: Map<string, React.RefObject<HTMLDivElement>>;
  selectedCardIds: string[];
  cardIdToFocusOnRender: string;
  hideGroup: (groupByOptionId: string) => void;
  addCard: (groupByOptionId?: string) => Promise<void> | void;
  showCard: (cardId: string) => void;
  propertyNameChanged: (option: IPropertyOption, text: string) => Promise<void>;
  onCardClicked: (e: React.MouseEvent, card: Card) => void;
  onDropToGroupHeader: (srcOption: IPropertyOption, dstOption?: IPropertyOption) => void;
  onDropToCard: (srcCard: Card, dstCard: Card) => void;
  onDropToGroup: (srcCard: Card, groupID: string, dstCardID: string) => void;
  disableAddingCards?: boolean;
  readOnlyTitle?: boolean;
  subRowsEmptyValueContent?: ReactElement | string;
  checkedIds?: string[];
  setCheckedIds?: Dispatch<SetStateAction<string[]>>;
};

const TableGroup = React.memo((props: Props): JSX.Element => {
  const { board, activeView, group, onDropToGroup, groupByProperty } = props;
  const groupId = group.option.id;

  const [{ isOver }, drop] = useDrop<Card, any, { isOver: boolean }>(
    () => ({
      accept: 'card',
      collect: (monitor) => ({
        isOver: monitor.isOver()
      }),
      drop: (item: Card, monitor) => {
        if (monitor.isOver({ shallow: true })) {
          onDropToGroup(item, groupId, '');
        }
      }
    }),
    [onDropToGroup, groupId]
  );

  let className = 'octo-table-group';
  if (isOver) {
    className += ' dragover';
  }

  return (
    <div ref={drop} className={className} key={group.option.id}>
      <TableGroupHeaderRow
        group={group}
        board={board}
        activeView={activeView}
        groupByProperty={groupByProperty}
        hideGroup={props.hideGroup}
        addCard={props.addCard}
        readOnly={props.readOnly}
        propertyNameChanged={props.propertyNameChanged}
        onDrop={props.onDropToGroupHeader}
        disableAddingCards={props.disableAddingCards}
        readOnlyTitle={props.readOnlyTitle}
      />

      {group.cards.length > 0 && (
        <TableRows
          board={board}
          activeView={activeView}
          columnRefs={props.columnRefs}
          cardPages={group.cardPages}
          selectedCardIds={props.selectedCardIds}
          readOnly={props.readOnly}
          cardIdToFocusOnRender={props.cardIdToFocusOnRender}
          showCard={props.showCard}
          resizingColumn=''
          offset={0}
          addCard={props.addCard}
          onCardClicked={props.onCardClicked}
          onDrop={props.onDropToCard}
          readOnlyTitle={props.readOnlyTitle}
          subRowsEmptyValueContent={props.subRowsEmptyValueContent}
          checkedIds={props.checkedIds}
          setCheckedIds={props.setCheckedIds}
        />
      )}
    </div>
  );
});

export default TableGroup;
