import { AvailablePagePermissions } from '@charmverse/core/permissions/flags';
import type { Space } from '@charmverse/core/prisma';
import { render } from '@testing-library/react';
import { v4 as uuid } from 'uuid';

import { createMockSpace } from 'testing/mocks/space';

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    query: {},
    route: '/',
    pathname: '',
    path: '',
    asPath: ''
  }))
}));

jest.mock('hooks/useProposal', () => ({
  useProposal: jest.fn(() => ({}))
}));

jest.mock('charmClient');

jest.mock('hooks/useCurrentSpace');
jest.mock('hooks/usePagePermissions');
// beforeEach(() => {
//   jest.resetModules();
// });

afterEach(() => {});

afterAll(() => {
  jest.resetModules();
});

describe('shareToWeb', () => {
  it('should render an enabled public toggle only if a user has permissions to toggle the public status of the page', async () => {
    jest.doMock('hooks/useCurrentSpace', () => ({
      useCurrentSpace: jest.fn(createMockSpace)
    }));

    const pageId = uuid();

    jest.doMock('hooks/usePages', () => ({
      usePages: jest.fn(() => ({
        pages: {
          [pageId]: {
            type: 'page',
            path: `path-${uuid()}`
          }
        }
      }))
    }));

    // Test user without permissions
    const usePagePermissions = await import('hooks/usePagePermissions');
    // eslint-disable-next-line no-unused-expressions
    usePagePermissions.usePagePermissions = jest.fn(() => ({ permissions: new AvailablePagePermissions().full }));
    //  jest.doMock('hooks/usePagePermissions', () => ({
    //   usePagePermissions: jest.fn(() => ({ permissions: new AvailablePagePermissions().full }))
    // }));

    const ShareToWeb = (await import('../ShareToWeb')).default;

    const resultWithPermissions = render(
      <ShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />
    );

    const toggle = resultWithPermissions.getByTestId('toggle-public-page', {}).children.item(0);
    expect(toggle?.getAttribute('type')).toBe('checkbox');

    // Important part of the test
    expect(toggle).not.toBeDisabled();
  });

  it('should render a disabled public toggle if a user does not have permissions to toggle the public status of the page', async () => {
    jest.doMock('hooks/useCurrentSpace', () => ({
      useCurrentSpace: jest.fn(createMockSpace)
    }));

    const pageId = uuid();

    jest.doMock('hooks/usePages', () => ({
      usePages: jest.fn(() => ({
        pages: {
          [pageId]: {
            type: 'page',
            path: `path-${uuid()}`
          }
        }
      }))
    }));

    // Test user without permissions
    const usePagePermissions = await import('hooks/usePagePermissions');
    // eslint-disable-next-line no-unused-expressions
    usePagePermissions.usePagePermissions = jest.fn(() => ({ permissions: new AvailablePagePermissions().empty }));

    const ShareToWeb = (await import('../ShareToWeb')).default;

    const resultWithPermissions = render(
      <ShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />
    );

    const toggle = resultWithPermissions.getByTestId('toggle-public-page', {}).children.item(0);
    expect(toggle?.getAttribute('type')).toBe('checkbox');

    // Important part of the test
    expect(toggle).toBeDisabled();
  });

  // it('should render a disabled public toggle if the space has activated public proposals and the page is a proposal page', async () => {
  //   jest.mock('hooks/useCurrentSpace', () => ({
  //     useCurrentSpace: jest.fn(createMockSpace)
  //   }));

  //   jest.mock('hooks/usePagePermissions', () => ({
  //     usePagePermissions: jest.fn(() => ({ permissions: new AvailablePagePermissions().full }))
  //   }));

  //   const pageId = uuid();

  //   jest.mock('hooks/usePages', () => ({
  //     usePages: jest.fn(() => ({
  //       [pageId]: {
  //         type: 'page'
  //       }
  //     }))
  //   }));

  //   const result = render(<ShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />);

  //   const toggle = result.getByTestId('toggle-public-page', {}).children.item(0);
  //   expect(toggle?.getAttribute('disabled')).toBe('');
  //   expect(toggle?.getAttribute('type')).toBe('checkbox');
  // });

  it('should render an enabled public toggle if the space has activated public proposals, user has permissions to toggle public status, and the page is not of type proposal', async () => {});
});
