import { render } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';

import { FetchMock } from '../../../test/fetchMock';
import { TestBlockFactory } from '../../../test/testBlockFactory';
import 'isomorphic-fetch';
import { wrapDNDIntl } from '../../../testUtils';

import CalculationRow from './calculationRow';

global.fetch = FetchMock.fn;

beforeEach(() => {
  FetchMock.fn.mockReset();
});

describe('components/table/calculation/CalculationRow', () => {
  const board = TestBlockFactory.createBoard();
  board.fields.cardProperties.push({
    id: 'property_2',
    name: 'Property 2',
    type: 'text',
    options: []
  });
  board.fields.cardProperties.push({
    id: 'property_3',
    name: 'Property 3',
    type: 'text',
    options: []
  });
  board.fields.cardProperties.push({
    id: 'property_4',
    name: 'Property 4',
    type: 'text',
    options: []
  });

  const view = TestBlockFactory.createBoardView(board);
  view.fields.visiblePropertyIds.push(...['property_2', 'property_3', 'property_4']);

  const card = TestBlockFactory.createCard(board);
  card.fields.properties.property_2 = 'Foo';
  card.fields.properties.property_3 = 'Bar';
  card.fields.properties.property_4 = 'Baz';

  const card2 = TestBlockFactory.createCard(board);
  card2.fields.properties.property_2 = 'Lorem';
  card2.fields.properties.property_3 = '';
  card2.fields.properties.property_4 = 'Baz';

  test('should render three calculation elements', async () => {
    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, card])));

    const component = wrapDNDIntl(
      <CalculationRow
        board={board}
        cards={[card, card2]}
        activeView={view}
        resizingColumn=''
        offset={0}
        readOnly={false}
      />
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('should match snapshot', async () => {
    board.fields.columnCalculations = {
      property_2: 'count',
      property_3: 'countValue',
      property_4: 'countUniqueValue'
    };

    const component = wrapDNDIntl(
      <CalculationRow
        board={board}
        cards={[card, card2]}
        activeView={view}
        resizingColumn=''
        offset={0}
        readOnly={false}
      />
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});
