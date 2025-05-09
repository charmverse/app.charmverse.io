import { render } from '@testing-library/react';
import React from 'react';

import { createCard } from '@packages/databases/card';

import { wrapIntl } from '../../../testUtils';

import LastModifiedAt from './lastModifiedAt';

describe('components/properties/lastModifiedAt', () => {
  test('should match snapshot', () => {
    const card = createCard();
    card.id = 'card-id-1';

    const component = wrapIntl(<LastModifiedAt updatedAt='' />);

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});
