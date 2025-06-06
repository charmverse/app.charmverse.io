import { AvailablePagePermissions } from '@charmverse/core/permissions/flags';
import type { ProposalWithUsersAndRubric } from '@packages/lib/proposals/interfaces';
import { render } from '@testing-library/react';
import { v4 as uuid, v4 } from 'uuid';

// Import hooks to mock
import { useGetProposalDetails } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePage } from 'hooks/usePage';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { mockCurrentSpaceContext } from 'lib/testing/mocks/useCurrentSpace';

import PaidShareToWeb from '../PaidShareToWeb';

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    query: {},
    route: '/',
    pathname: '',
    path: '',
    asPath: ''
  }))
}));
jest.mock('charmClient/hooks/proposals', () => ({
  useGetProposalDetails: jest.fn(() => ({
    proposal: null
  }))
}));
jest.mock('charmClient');
jest.mock('hooks/useCurrentSpace');
jest.mock('hooks/usePagePermissions', () => ({
  usePagePermissions: jest.fn(() => ({
    permissions: new AvailablePagePermissions({ isReadonlySpace: false }).empty
  }))
}));
jest.mock('hooks/usePage', () => ({
  usePage: jest.fn(() => ({
    page: {
      type: 'page'
    }
  }))
}));
jest.mock('hooks/useCurrentSpace', () => ({
  useCurrentSpace: jest.fn(() => mockCurrentSpaceContext())
}));

afterAll(() => {
  jest.resetModules();
});

describe.skip('PaidShareToWeb', () => {
  it('should render the toggle as checked if a public permission exists or as unchecked if no public permission exists', async () => {
    const pageId = uuid();

    (usePagePermissions as jest.Mock<Partial<ReturnType<typeof usePagePermissions>>>).mockReturnValueOnce({
      permissions: new AvailablePagePermissions({ isReadonlySpace: false }).full
    });

    const resultWithPermissions = render(
      <PaidShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />
    );

    let toggle = resultWithPermissions.getByTestId('toggle-public-page', {});
    expect(toggle?.getAttribute('type')).toBe('button');

    // Important part of the test
    expect(toggle).not.toBeChecked();
    expect(toggle).not.toBeDisabled();

    (usePagePermissions as jest.Mock<Partial<ReturnType<typeof usePagePermissions>>>).mockReturnValueOnce({
      permissions: new AvailablePagePermissions({ isReadonlySpace: false }).full
    });

    // Re-render this with a public permission
    resultWithPermissions.rerender(
      <PaidShareToWeb
        pageId={pageId}
        pagePermissions={[
          {
            id: v4(),
            pageId,
            permissionLevel: 'view',
            assignee: { group: 'public' }
          }
        ]}
        refreshPermissions={jest.fn()}
      />
    );

    toggle = resultWithPermissions.getByTestId('toggle-public-page', {});
    expect(toggle?.getAttribute('type')).toBe('button');

    // Important part of the test
    expect(toggle).toHaveTextContent('Unpublish');
    expect(toggle).not.toBeDisabled();
  });

  it('should render an enabled public toggle only if a user has permissions to toggle the public status of the page', async () => {
    const pageId = uuid();

    (usePagePermissions as jest.Mock<Partial<ReturnType<typeof usePagePermissions>>>).mockReturnValueOnce({
      permissions: new AvailablePagePermissions({ isReadonlySpace: false }).full
    });

    const resultWithPermissions = render(
      <PaidShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />
    );

    const toggle = resultWithPermissions.getByTestId('toggle-public-page', {});
    expect(toggle?.getAttribute('type')).toBe('button');

    // Important part of the test
    expect(toggle).not.toBeDisabled();
  });

  it('should render a disabled public toggle if a user does not have permissions to toggle the public status of the page', async () => {
    const pageId = uuid();

    (usePagePermissions as jest.Mock<Partial<ReturnType<typeof usePagePermissions>>>).mockReturnValueOnce({
      permissions: new AvailablePagePermissions({ isReadonlySpace: false }).empty
    });

    const resultWithPermissions = render(
      <PaidShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />
    );

    const toggle = resultWithPermissions.getByTestId('toggle-public-page', {});
    expect(toggle?.getAttribute('type')).toBe('button');

    // Important part of the test
    expect(toggle).toBeDisabled();
  });

  it('should render a disabled unchecked public toggle if the proposal has isPublic: false', async () => {
    const pageId = uuid();

    (usePagePermissions as jest.Mock<Partial<ReturnType<typeof usePagePermissions>>>).mockReturnValueOnce({
      permissions: new AvailablePagePermissions({ isReadonlySpace: false }).full
    });
    (useGetProposalDetails as jest.Mock<Partial<ReturnType<typeof useGetProposalDetails>>>).mockReturnValueOnce({
      data: {
        status: 'draft',
        isPublic: false
      } as ProposalWithUsersAndRubric
    });

    (usePage as jest.Mock).mockReturnValueOnce({
      page: {
        type: 'proposal'
      }
    });

    (useCurrentSpace as jest.Mock<ReturnType<typeof useCurrentSpace>>).mockReturnValueOnce(
      mockCurrentSpaceContext({
        publicProposals: true
      })
    );

    const resultWithPermissions = render(
      <PaidShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />
    );

    const toggle = resultWithPermissions.getByTestId('toggle-public-page', {});
    expect(toggle?.getAttribute('type')).toBe('button');

    // Important part of the test
    expect(toggle).toHaveTextContent('Publish to web');
    expect(toggle).toBeDisabled();
  });

  it('should render a disabled checked public toggle if the proposal is marked as isPublic', async () => {
    const pageId = uuid();

    (usePagePermissions as jest.Mock<Partial<ReturnType<typeof usePagePermissions>>>).mockReturnValueOnce({
      permissions: new AvailablePagePermissions({ isReadonlySpace: false }).full
    });
    (useGetProposalDetails as jest.Mock<Partial<ReturnType<typeof useGetProposalDetails>>>).mockReturnValueOnce({
      data: {
        status: 'published',
        isPublic: true
      } as ProposalWithUsersAndRubric
    });

    (usePage as jest.Mock).mockReturnValueOnce({
      page: {
        type: 'proposal'
      }
    });

    (useCurrentSpace as jest.Mock<ReturnType<typeof useCurrentSpace>>).mockReturnValueOnce(
      mockCurrentSpaceContext({
        publicProposals: true
      })
    );

    const resultWithPermissions = render(
      <PaidShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />
    );

    const toggle = resultWithPermissions.getByTestId('toggle-public-page', {});
    expect(toggle?.getAttribute('type')).toBe('button');

    // Important part of the test
    expect(toggle).toBeDisabled();
    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveTextContent('Unpublish');
  });

  it('should render an enabled public toggle if the space has activated public proposals, user has permissions to toggle public status, and the page is not of type proposal', async () => {
    const pageId = uuid();

    (usePagePermissions as jest.Mock<Partial<ReturnType<typeof usePagePermissions>>>).mockReturnValueOnce({
      permissions: new AvailablePagePermissions({ isReadonlySpace: false }).full
    });

    (usePage as jest.Mock).mockReturnValueOnce({
      page: {
        type: 'page'
      }
    });

    (useCurrentSpace as jest.Mock<ReturnType<typeof useCurrentSpace>>).mockReturnValueOnce(
      mockCurrentSpaceContext({
        publicProposals: true
      })
    );

    const resultWithPermissions = render(
      <PaidShareToWeb pageId={pageId} pagePermissions={[]} refreshPermissions={jest.fn()} />
    );

    const toggle = resultWithPermissions.getByTestId('toggle-public-page', {});
    expect(toggle?.getAttribute('type')).toBe('button');

    // Important part of the test
    expect(toggle).not.toBeDisabled();
  });
});
