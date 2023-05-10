import '@testing-library/jest-dom/extend-expect';
import type { ClientOptions } from '@uauth/js';

import type { CommentContent } from 'lib/comments';
import { customRenderWithContext } from 'testing/customRender';

import { CommentForm } from '../CommentForm';

jest.mock('hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: {}
}));

jest.mock('lit-js-sdk', () => ({
  humanizeAccessControlConditions: () => {}
}));

jest.mock('@uauth/js', () => ({
  UAuth: (options: ClientOptions) => {}
}));

jest.mock('lib/snapshot/getProposal', () => ({
  getSnapshotProposal: () => ({ proposals: [] })
}));

jest.mock('lib/snapshot/getSpace', () => ({
  getSnapshotSpace: () => ({ space: {} })
}));

jest.mock('lib/snapshot/getVotes', () => ({
  getSnapshotVotes: () => ({ votes: {} })
}));

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/[domain]/',
    query: {
      domain: 'test-space'
    },
    isReady: true
  })
}));

describe('<CommentForm />', () => {
  test('NameConsumer shows value from provider', () => {
    const { container } = customRenderWithContext(<CommentForm handleCreateComment={async () => {}} />, {});
    const placeholder = container.querySelector('[data-placeholder="What are your thoughts?');
    expect(placeholder).toBeInTheDocument();
  });
});
