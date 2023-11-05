import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import React from 'react';

import Link from './link';

describe('components/properties/link', () => {
  test('returns link properties correctly', () => {
    const component = (
      <Link
        value='https://github.com/mattermost/focalboard'
        onChange={jest.fn()}
        onSave={jest.fn()}
        onCancel={jest.fn()}
        validator={jest.fn(() => true)}
      />
    );
    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});
