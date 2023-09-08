import { customRenderWithContext } from 'testing/customRender';

import { CommentForm } from '../CommentForm';

jest.mock('components/common/CharmEditor/components/inlineDatabase/components/InlineDatabase', () => ({}));
jest.mock('components/common/CharmEditor/components/poll/PollComponent', () => ({}));

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
    const placeholder = container.querySelector('[data-placeholder="What are your thoughts?"');
    expect(placeholder).toBeInTheDocument();
  });
});
