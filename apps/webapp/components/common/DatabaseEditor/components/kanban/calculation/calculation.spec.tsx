import { TestBlockFactory } from '@packages/databases/test/testBlockFactory';
import { render } from '@testing-library/react';
import React from 'react';

import { wrapIntl } from '../../../testUtils';

import { KanbanCalculation } from './calculation';

describe('components/kanban/calculation/KanbanCalculation', () => {
  const board = TestBlockFactory.createBoard();
  const cards = [
    TestBlockFactory.createCard(board),
    TestBlockFactory.createCard(board),
    TestBlockFactory.createCard(board)
  ];

  test('base case', () => {
    const component = wrapIntl(
      <KanbanCalculation
        cards={cards}
        cardProperties={board.fields.cardProperties}
        menuOpen={false}
        onMenuClose={() => {}}
        onMenuOpen={() => {}}
        onChange={() => {}}
        value='count'
        property={board.fields.cardProperties[0]}
        readOnly={false}
        anchorEl={null}
      />
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('calculations menu open', () => {
    const component = wrapIntl(
      <KanbanCalculation
        cards={cards}
        cardProperties={board.fields.cardProperties}
        menuOpen={true}
        onMenuClose={() => {}}
        onMenuOpen={() => {}}
        onChange={() => {}}
        value='count'
        property={board.fields.cardProperties[0]}
        readOnly={false}
        anchorEl={null}
      />
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('no menu should appear in readonly mode', () => {
    const component = wrapIntl(
      <KanbanCalculation
        cards={cards}
        cardProperties={board.fields.cardProperties}
        menuOpen={true}
        onMenuClose={() => {}}
        onMenuOpen={() => {}}
        onChange={() => {}}
        value='count'
        property={board.fields.cardProperties[0]}
        readOnly={true}
        anchorEl={null}
      />
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});
