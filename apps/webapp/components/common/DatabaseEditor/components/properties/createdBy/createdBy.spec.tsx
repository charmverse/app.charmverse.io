import { render } from '@testing-library/react';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import configureStore from 'redux-mock-store';

import { createCard } from '@packages/databases/card';

import type { IUser } from '../../../user';

import CreatedBy from './createdBy';

describe('components/properties/createdBy', () => {
  test('should match snapshot', () => {
    const card = createCard();
    card.createdBy = 'user-id-1';

    const mockStore = configureStore([]);
    const store = mockStore({
      users: {
        workspaceUsers: {
          'user-id-1': { username: 'username_1' } as IUser
        }
      }
    });

    const component = (
      <ReduxProvider store={store}>
        <CreatedBy userId='user-id-1' />
      </ReduxProvider>
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});
