import { MockDataProvider, render } from 'lib/testing/customRender';

import { CommentForm } from '../CommentForm';

jest.mock('components/common/CharmEditor/components/inlineDatabase/components/InlineDatabase', () => ({}));
jest.mock('components/common/CharmEditor/components/poll/PollComponent', () => ({}));
jest.mock('components/common/CharmEditor/components/farcasterFrame/components/FarcasterFrameNodeView', () => ({}));

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
  test('shows a placeholder', () => {
    const { container } = render(
      <MockDataProvider>
        <CommentForm handleCreateComment={async () => {}} />
      </MockDataProvider>
    );
    const placeholder = container.querySelector('[data-placeholder="What are your thoughts?"');
    expect(placeholder).toBeInTheDocument();
  });
});
