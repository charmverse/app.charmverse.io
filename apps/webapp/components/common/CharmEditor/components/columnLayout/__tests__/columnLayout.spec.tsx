import { jsonDoc, builders as _ } from '@packages/bangleeditor/builders';

import { CharmEditor } from 'components/common/CharmEditor';
import { render, MockDataProvider } from 'lib/testing/customRender';

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

describe('Charm Plugin: columnLayout', () => {
  test('renders the columns', () => {
    const content = jsonDoc(_.columnLayout(_.columnBlock(_.p('Hello')), _.columnBlock(_.p('World'))));

    const { container } = render(
      <MockDataProvider>
        <CharmEditor isContentControlled content={content} readOnly={true} />
      </MockDataProvider>,
      {}
    );
    const resizer = container.querySelector('.charm-column-resizer');
    expect(resizer).toBeInTheDocument();
  });
});
