/* eslint-disable max-lines */
import React from 'react';
import { useDrop } from 'react-dnd';

import type { Board, IPropertyOption, IPropertyTemplate, BoardGroup } from '../../blocks/board';
import type { BoardView } from '../../blocks/boardView';
import type { Card } from '../../blocks/card';

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
    addCard: (groupByOptionId?: string) => Promise<void>;
    showCard: (cardId: string) => void;
    propertyNameChanged: (option: IPropertyOption, text: string) => Promise<void>;
    onCardClicked: (e: React.MouseEvent, card: Card) => void;
    onDropToGroupHeader: (srcOption: IPropertyOption, dstOption?: IPropertyOption) => void;
    onDropToCard: (srcCard: Card, dstCard: Card) => void;
    onDropToGroup: (srcCard: Card, groupID: string, dstCardID: string) => void;
}

const TableGroup = React.memo((props: Props): JSX.Element => {
  const { board, activeView, group, onDropToGroup, groupByProperty } = props;
  const groupId = group.option.id;

  const [{ isOver }, drop] = useDrop<Card, any, { isOver: boolean }>(() => ({
    accept: 'card',
    collect: (monitor) => ({
      isOver: monitor.isOver()
    }),
    drop: (item: Card, monitor) => {
      if (monitor.isOver({ shallow: true })) {
        onDropToGroup(item, groupId, '');
      }
    }
  }), [onDropToGroup, groupId]);

  let className = 'octo-table-group';
  if (isOver) {
    className += ' dragover';
  }

  return (
    <div
      ref={drop}
      className={className}
      key={group.option.id}
    >
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
      />

      {(group.cards.length > 0)
            && (
              <TableRows
                board={board}
                activeView={activeView}
                columnRefs={props.columnRefs}
                cards={group.cards}
                selectedCardIds={props.selectedCardIds}
                readOnly={props.readOnly}
                cardIdToFocusOnRender={props.cardIdToFocusOnRender}
                showCard={props.showCard}
                resizingColumn=''
                offset={0}
                addCard={props.addCard}
                onCardClicked={props.onCardClicked}
                onDrop={props.onDropToCard}
              />
            )}
    </div>
  );
});

export default TableGroup;
