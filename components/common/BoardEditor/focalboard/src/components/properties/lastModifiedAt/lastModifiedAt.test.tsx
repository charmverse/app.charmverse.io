
import React from 'react';
import { render } from '@testing-library/react';

import { wrapIntl } from '../../../testUtils';

import { createCard } from '../../../blocks/card';
import { createCommentBlock } from '../../../blocks/commentBlock';

import LastModifiedAt from './lastModifiedAt';

describe('componnets/properties/lastModifiedAt', () => {
  test('should match snapshot', () => {
    const card = createCard();
    card.id = 'card-id-1';

    const component = wrapIntl(
      <LastModifiedAt
        updatedAt=''
      />
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});
