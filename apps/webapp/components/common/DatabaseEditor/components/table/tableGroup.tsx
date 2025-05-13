/* eslint-disable max-lines */
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import React from 'react';
import { useDrop } from 'react-dnd';

import { useLocalStorage } from 'hooks/useLocalStorage';
import type { Board, IPropertyOption, IPropertyTemplate, BoardGroup } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';

import TableGroupHeaderRow from './tableGroupHeaderRow';
import TableRows from './tableRows';

export type Props = {
  board: Board;
  activeView: BoardView;
  groupByProperty?: IPropertyTemplate;
  group: BoardGroup;
  readOnly: boolean;
  columnRefs: Map<string, React.RefObject<HTMLDivElement>>;
  selectedCardIds: string[];
  cardIdToFocusOnRender: string;
  addCard: (groupByOptionId?: string) => Promise<void> | void;
  showCard: (cardId: string, event?: React.MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => void;
  propertyNameChanged: (option: IPropertyOption, text: string) => Promise<void>;
  onCardClicked: (e: React.MouseEvent, card: Card) => void;
  onDropToGroupHeader: (srcOption: BoardGroup, dstOption?: BoardGroup) => void;
  onDropToCard: (srcCard: Card, dstCard: Card) => void;
  onDropToGroup: (srcCard: Card, groupID: string, dstCardID: string) => void;
  disableAddingCards?: boolean;
  readOnlyTitle?: boolean;
  expandSubRowsOnLoad?: boolean;
  rowExpansionLocalStoragePrefix?: string;
  subRowsEmptyValueContent?: ReactElement | string;
  checkedIds?: string[];
  setCheckedIds?: Dispatch<SetStateAction<string[]>>;
  isExpandedGroup?: boolean; // it is undefined until we have loaded local storage
  toggleGroup: (groupId: string) => void;
};

const TableGroup = React.memo((props: Props): JSX.Element => {
  const { board, activeView, group, onDropToGroup, groupByProperty } = props;
  const groupId = group.id;

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
    <div ref={drop as any} className={className} key={group.option?.id || group.value}>
      <TableGroupHeaderRow
        group={group}
        board={board}
        activeView={activeView}
        isExpandedGroup={props.isExpandedGroup}
        groupByProperty={groupByProperty}
        hideGroup={props.toggleGroup}
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
          cards={group.cards}
          disableDragAndDrop={
            groupByProperty && groupByProperty.type !== 'select' && groupByProperty.type !== 'multiSelect'
          } // disables drag and drop
          selectedCardIds={props.selectedCardIds}
          readOnly={props.readOnly}
          cardIdToFocusOnRender={props.cardIdToFocusOnRender}
          showCard={(cardId, _, e) => props.showCard(cardId, e)}
          resizingColumn=''
          offset={0}
          isExpandedGroup={props.isExpandedGroup}
          addCard={props.addCard}
          onCardClicked={props.onCardClicked}
          onDrop={props.onDropToCard}
          readOnlyTitle={props.readOnlyTitle}
          expandSubRowsOnLoad={props.expandSubRowsOnLoad}
          rowExpansionLocalStoragePrefix={props.rowExpansionLocalStoragePrefix}
          subRowsEmptyValueContent={props.subRowsEmptyValueContent}
          checkedIds={props.checkedIds}
          setCheckedIds={props.setCheckedIds}
        />
      )}
    </div>
  );
});

export default TableGroup;
