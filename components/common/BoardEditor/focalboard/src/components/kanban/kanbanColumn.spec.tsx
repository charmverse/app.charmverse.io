import { render } from '@testing-library/react';
import React from 'react';

import { wrapDNDIntl } from '../../testUtils';

import KanbanColumn from './kanbanColumn';

describe('src/components/kanban/kanbanColumn', () => {
  test('should match snapshot', () => {
    const { container } = render(wrapDNDIntl(<KanbanColumn onDrop={jest.fn()}>{}</KanbanColumn>));
    expect(container).toMatchSnapshot();
  });
});
