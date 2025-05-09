import Link from 'components/common/Link';
import { renderWithTheme } from 'lib/testing/customRender';
import { mockCurrentSpaceContext } from 'lib/testing/mocks/useCurrentSpace';

jest.mock('hooks/useCurrentSpace', () => ({
  useCurrentSpace: jest.fn(() => mockCurrentSpaceContext())
}));

describe('Atomic Link component', () => {
  it('should detect and render proper external url', async () => {
    const renderedLink = renderWithTheme(<Link href='https://app.cv.io'>test label</Link>, { hydrate: false });
    const link = renderedLink.getByText('test label');

    expect(link?.getAttribute('href')).toBe('https://app.cv.io');
  });

  it('should prefix url with space domain and return path', async () => {
    const renderedLink = renderWithTheme(<Link href='/forum/page-123'>test label</Link>, { hydrate: false });
    const link = renderedLink.getByText('test label');

    expect(link?.getAttribute('href')).toBe('/test-space/forum/page-123');
  });
});
