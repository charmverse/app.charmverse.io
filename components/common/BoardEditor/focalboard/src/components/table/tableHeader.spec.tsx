
import { render } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';

import 'isomorphic-fetch';
import { TestBlockFactory } from '../../test/testBlockFactory';
import { wrapDNDIntl } from '../../testUtils';

import TableHeader from './tableHeader';

describe('components/table/TableHeaderMenu', () => {
  const board = TestBlockFactory.createBoard();
  const view = TestBlockFactory.createBoardView(board);

  const view2 = TestBlockFactory.createBoardView(board);
  view2.fields.sortOptions = [];

  test('should match snapshot, title column', async () => {
    const onAutoSizeColumn = jest.fn();
    const component = wrapDNDIntl(
      <TableHeader
        readOnly={false}
        sorted='none'
        name='my Name'
        board={board}
        activeView={view}
        cards={[]}
        views={[view, view2]}
        template={board.fields.cardProperties[0]}
        offset={0}
        onDrop={jest.fn()}
        onAutoSizeColumn={onAutoSizeColumn}
      />
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});
