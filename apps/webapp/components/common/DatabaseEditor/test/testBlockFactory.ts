import { v4 } from 'uuid';

import type { UIBlockWithDetails } from '@packages/databases/block';
import type { Board, IPropertyOption, IPropertyTemplate } from '@packages/databases/board';
import { createBoard } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import { createBoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';
import { createCard } from '@packages/databases/card';
import { createFilterClause } from '@packages/databases/filterClause';
import { createFilterGroup } from '@packages/databases/filterGroup';

class TestBlockFactory {
  static createBoard(): Board {
    const board = createBoard();
    board.rootId = board.id;
    board.title = 'board title';
    board.fields.description = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: []
        }
      ]
    };
    board.fields.showDescription = true;
    board.fields.icon = 'i';

    for (let i = 0; i < 3; i++) {
      const propertyOption: IPropertyOption = {
        id: 'value1',
        value: 'value 1',
        color: 'propColorTurquoise'
      };
      const propertyTemplate: IPropertyTemplate = {
        id: `property${i + 1}`,
        name: `Property ${i + 1}`,
        type: 'select',
        options: [propertyOption]
      };
      board.fields.cardProperties.push(propertyTemplate);
    }

    return board;
  }

  static createBoardView(board?: Board): BoardView {
    const view = createBoardView();
    view.parentId = board ? board.id : 'parent';
    view.rootId = board ? board.rootId : 'root';
    view.title = 'view title';
    view.fields.viewType = 'board';
    view.fields.groupById = 'property1';
    view.fields.hiddenOptionIds = ['value1'];
    view.fields.cardOrder = ['card1', 'card2', 'card3'];
    view.fields.sortOptions = [
      {
        propertyId: 'property1',
        reversed: true
      },
      {
        propertyId: 'property2',
        reversed: false
      }
    ];
    view.fields.columnWidths = {
      column1: 100,
      column2: 200
    };

    // Filter
    const filterGroup = createFilterGroup();
    const filter = createFilterClause();
    filter.propertyId = 'property1';
    filter.condition = 'contains';
    filter.values = ['value1'];
    filter.filterId = v4();
    filterGroup.filters.push(filter);
    view.fields.filter = filterGroup;

    return view;
  }

  static createTableView(board?: Board): BoardView {
    const view = createBoardView();
    view.parentId = board ? board.id : 'parent';
    view.rootId = board ? board.rootId : 'root';
    view.title = 'view title';
    view.fields.viewType = 'table';
    view.fields.groupById = 'property1';
    view.fields.hiddenOptionIds = ['value1'];
    view.fields.cardOrder = ['card1', 'card2', 'card3'];
    view.fields.sortOptions = [
      {
        propertyId: 'property1',
        reversed: true
      },
      {
        propertyId: 'property2',
        reversed: false
      }
    ];
    view.fields.columnWidths = {
      column1: 100,
      column2: 200
    };

    // Filter
    const filterGroup = createFilterGroup();
    const filter = createFilterClause();
    filter.propertyId = 'property1';
    filter.condition = 'contains';
    filter.values = ['value1'];
    filter.filterId = v4();
    filterGroup.filters.push(filter);
    view.fields.filter = filterGroup;

    return view;
  }

  static createCard(board?: Board): Card {
    const card = createCard();
    card.parentId = board ? board.id : 'parent';
    card.rootId = board ? board.rootId : 'root';
    card.title = 'title';
    card.fields.icon = 'i';
    card.fields.properties.property1 = 'value1';

    return card;
  }

  private static addToCard<BlockType extends UIBlockWithDetails>(
    block: BlockType,
    card: Card,
    isContent = true
  ): BlockType {
    block.parentId = card.id;
    block.rootId = card.rootId;
    if (isContent) {
      card.fields.contentOrder.push(block.id);
    }
    return block;
  }
}

export { TestBlockFactory };
