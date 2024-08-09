import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import { TestBlockFactory } from '../../test/testBlockFactory';
import { wrapDNDIntl } from '../../testUtils';

import TableHeaders from './tableHeaders';

describe('components/table/TableHeaders', () => {
  const board = TestBlockFactory.createBoard();
  const card = TestBlockFactory.createCard(board);
  const view = TestBlockFactory.createBoardView(board);

  test('should match snapshot', async () => {
    const component = wrapDNDIntl(
      <TableHeaders
        board={board}
        cards={[card]}
        activeView={view}
        views={[view]}
        readOnly={false}
        resizingColumn=''
        offset={0}
        columnRefs={new Map()}
      />
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});
