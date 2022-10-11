
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import React from 'react';

import RootPortal from './rootPortal';

describe('components/RootPortal', () => {
  beforeEach(() => {
    // Quick fix to disregard console error when unmounting a component

  });

  test('should match snapshot', () => {
    const rootPortalDiv = document.createElement('div');
    rootPortalDiv.id = 'focalboard-root-portal';

    const { getByText, container } = render(
      <RootPortal>
        <div>Testing Portal</div>
      </RootPortal>,
      { container: document.body.appendChild(rootPortalDiv) }
    );

    expect(getByText('Testing Portal')).toBeVisible();
    expect(container).toMatchSnapshot();
  });
});
