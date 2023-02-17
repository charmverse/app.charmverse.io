import { v4 } from 'uuid';

import { InsecureOperationError } from 'lib/utilities/errors';

import type { PermissionFilteringPolicyFnInput } from '../buildComputePermissionsWithPermissionFilteringPolicies';
import { buildComputePermissionsWithPermissionFilteringPolicies } from '../buildComputePermissionsWithPermissionFilteringPolicies';
import type { PermissionCompute } from '../interfaces';

type ExampleResource = {
  id: string;
  name: string;
  spaceId: string;
};

type ExampleResourceFlags = {
  read: boolean;
  write: boolean;
  delete: boolean;
  update: boolean;
};

const mockCompute = jest.fn((props: PermissionCompute) => {
  // All flags are true by default except delete
  return Promise.resolve({ delete: false, read: true, write: true, update: true } as ExampleResourceFlags);
});

const mockResolver = jest.fn(() => {
  return Promise.resolve({ id: v4(), name: 'Example resource', spaceId: v4() } as ExampleResource);
});

const mockPfpNoWrite = jest.fn((props: PermissionFilteringPolicyFnInput<ExampleResource, ExampleResourceFlags>) => {
  return Promise.resolve({ ...props.flags, write: false });
});

const mockPfpNoUpdate = jest.fn((props: PermissionFilteringPolicyFnInput<ExampleResource, ExampleResourceFlags>) => {
  return Promise.resolve({ ...props.flags, update: false });
});
const computePermissionsWithPfPs = buildComputePermissionsWithPermissionFilteringPolicies<
  ExampleResource,
  ExampleResourceFlags
>({
  computeFn: mockCompute,
  resolver: mockResolver,
  pfps: [mockPfpNoWrite, mockPfpNoUpdate]
});

describe('buildComputePermissionsWithPermissionFilteringPolicies', () => {
  it('should take a base permission compute function and apply all permission filtering polices', async () => {
    // UIDs don't matter here since our mock functions always resolve
    const flags = await computePermissionsWithPfPs({ resourceId: v4(), userId: v4() });
    expect(flags).toEqual({
      read: true,
      delete: false,
      update: false,
      write: false
    });

    expect(mockCompute).toHaveBeenCalledTimes(1);
    expect(mockResolver).toHaveBeenCalledTimes(1);
    expect(mockPfpNoWrite).toHaveBeenCalledTimes(1);
    expect(mockPfpNoUpdate).toHaveBeenCalledTimes(1);
  });

  it('should skip remaining PFPs if all permission flags evaluate to false', async () => {
    const emptyFlags: ExampleResourceFlags = { read: false, write: false, delete: false, update: false };

    const mockIgnoredPfp = jest.fn((props: PermissionFilteringPolicyFnInput<ExampleResource, ExampleResourceFlags>) => {
      return Promise.resolve({ ...props.flags, delete: true });
    });

    const mockAllFalsePfp = jest.fn(
      (props: PermissionFilteringPolicyFnInput<ExampleResource, ExampleResourceFlags>) => {
        return Promise.resolve({ ...emptyFlags });
      }
    );

    const optimisedCompute = buildComputePermissionsWithPermissionFilteringPolicies({
      computeFn: mockCompute,
      resolver: mockResolver,
      // This PFP adds a new permission flag, but the compute function resolved it as false
      pfps: [mockAllFalsePfp, mockIgnoredPfp]
    });

    await expect(optimisedCompute({ resourceId: v4(), userId: v4() })).resolves.toEqual(emptyFlags);
    expect(mockIgnoredPfp).not.toHaveBeenCalled();
    expect(mockAllFalsePfp).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if any PFP adds new permission flags', async () => {
    const mockPfpAddDelete = jest.fn(
      (props: PermissionFilteringPolicyFnInput<ExampleResource, ExampleResourceFlags>) => {
        return Promise.resolve({ ...props.flags, delete: true });
      }
    );

    const insecureCompute = buildComputePermissionsWithPermissionFilteringPolicies({
      computeFn: mockCompute,
      resolver: mockResolver,
      // This PFP adds a new permission flag, but the compute function resolved it as false
      pfps: [mockPfpAddDelete]
    });

    await expect(insecureCompute({ resourceId: v4(), userId: v4() })).rejects.toBeInstanceOf(InsecureOperationError);
  });
  it('should check for admin access if the resource has a spaceId and pass this to the PFPs', async () => {
    jest.resetModules();

    const hasAccessToSpace = jest.fn(() => Promise.resolve({ isAdmin: true }));

    jest.mock('lib/users/hasAccessToSpace', () => {
      return {
        hasAccessToSpace
      };
    });

    const {
      buildComputePermissionsWithPermissionFilteringPolicies:
        buildComputePermissionsWithPermissionFilteringPoliciesWithMockedHasAccess
    } = await import('../buildComputePermissionsWithPermissionFilteringPolicies');
    const mockedCompute = buildComputePermissionsWithPermissionFilteringPoliciesWithMockedHasAccess({
      computeFn: mockCompute,
      resolver: mockResolver,
      pfps: [mockPfpNoWrite]
    });

    await mockedCompute({ resourceId: v4(), userId: v4() });

    expect(hasAccessToSpace).toHaveBeenCalled();
    expect(mockPfpNoWrite).toHaveBeenCalledWith({
      isAdmin: true,
      flags: expect.any(Object),
      resource: expect.any(Object),
      userId: expect.any(String)
    });
  });
});
