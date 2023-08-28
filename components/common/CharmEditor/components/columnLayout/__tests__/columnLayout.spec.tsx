import { CharmEditor } from 'components/common/CharmEditor';
import { customRenderWithContext } from 'testing/customRender';
import { jsonDoc, builders as _ } from 'testing/prosemirror/builders';

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

describe('Charm Plugin: columnLayout', () => {
  test('renders the columns', () => {
    const content = jsonDoc(_.columnLayout(_.columnBlock(_.p('Hello')), _.columnBlock(_.p('World'))));
    const component = <CharmEditor isContentControlled content={content} readOnly={true} />;
    const { container } = customRenderWithContext(component, {});
    const resizer = container.querySelector('.charm-column-resizer');
    expect(resizer).toBeInTheDocument();
  });
});
