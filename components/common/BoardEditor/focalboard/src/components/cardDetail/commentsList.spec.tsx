import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { Provider as ReduxProvider } from 'react-redux';
import configureStore from 'redux-mock-store';

import { createCommentBlock } from '../../blocks/commentBlock';
import { FetchMock } from '../../test/fetchMock';
import { mockDOM, wrapIntl } from '../../testUtils';

import CommentsList from './commentsList';

window.fetch = FetchMock.fn;

beforeEach(() => {
  FetchMock.fn.mockReset();
});

beforeAll(() => {
  mockDOM();
});

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/[domain]/',
    query: {
      domain: 'test-space'
    },
    isReady: true
  })
}));

describe('components/cardDetail/CommentsList', () => {
  const comment1 = createCommentBlock();
  const comment2 = createCommentBlock();

  test('comments show up', async () => {
    const mockStore = configureStore([]);
    const store = mockStore({
      users: {
        workspaceUsers: [{ username: 'username_1' }]
      }
    });

    const component = (
      <ReduxProvider store={store}>
        {wrapIntl(<CommentsList comments={[comment1, comment2]} rootId='root_id' cardId='card_id' readOnly={false} />)}
      </ReduxProvider>
    );

    let container: Element | DocumentFragment | null = null;

    await act(async () => {
      const result = render(component);
      container = result.container;
    });

    expect(container).toBeDefined();

    // Comments show up
    const comments = container!.querySelectorAll('.Comment');
    expect(comments.length).toBe(2);
  });

  test('comments show up in readonly mode', async () => {
    const mockStore = configureStore([]);
    const store = mockStore({
      users: {
        workspaceUsers: [{ username: 'username_1' }]
      }
    });

    const component = (
      <ReduxProvider store={store}>
        {wrapIntl(<CommentsList comments={[comment1, comment2]} rootId='root_id' cardId='card_id' readOnly={true} />)}
      </ReduxProvider>
    );

    let container: Element | DocumentFragment | null = null;

    await act(async () => {
      const result = render(component);
      container = result.container;
    });

    expect(container).toBeDefined();

    // Comments show up
    const comments = container!.querySelectorAll('.Comment');
    expect(comments.length).toBe(2);

    // Add comment option visible when readonly mode is off
    const newCommentSection = container!.querySelectorAll('#CommentsList.send');
    expect(newCommentSection.length).toBe(0);
  });
});
