
import { render } from '@testing-library/react';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import configureStore from 'redux-mock-store';

import { createBoard } from '../../../blocks/board';
import { createCard } from '../../../blocks/card';
import { createCommentBlock } from '../../../blocks/commentBlock';
import type { IUser } from '../../../user';

import LastModifiedBy from './lastModifiedBy';

describe('components/properties/lastModifiedBy', () => {
  test('should match snapshot', () => {

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
        <LastModifiedBy
          updatedBy='user-id-1'
        />
      </ReduxProvider>
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});
