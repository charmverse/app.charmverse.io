import { TestBlockFactory } from '@packages/databases/test/testBlockFactory';
import { render } from '@testing-library/react';
import React from 'react';

import { Option } from './kanbanOption';

describe('components/kanban/calculations/Option', () => {
  const board = TestBlockFactory.createBoard();

  test('base case', () => {
    const component = (
      <Option
        data={{
          label: 'Count Unique Values',
          displayName: 'Unique',
          value: 'countUniqueValue',
          cardProperties: board.fields.cardProperties,
          onChange: () => {},
          activeValue: 'count',
          activeProperty: board.fields.cardProperties[1]
        }}
      />
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});
