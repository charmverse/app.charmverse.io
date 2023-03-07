import { v4 } from 'uuid';

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

const mockPolicyNoWrite = jest.fn((props: PermissionFilteringPolicyFnInput<ExampleResource, ExampleResourceFlags>) => {
  return Promise.resolve({ ...props.flags, write: false });
});

const mockPolicyNoUpdate = jest.fn((props: PermissionFilteringPolicyFnInput<ExampleResource, ExampleResourceFlags>) => {
  return Promise.resolve({ ...props.flags, update: false });
});
const computePermissionsWithPolicies = buildComputePermissionsWithPermissionFilteringPolicies<
  ExampleResource,
  ExampleResourceFlags
>({
  computeFn: mockCompute,
  resolver: mockResolver,
  policies: [mockPolicyNoWrite, mockPolicyNoUpdate]
});

describe('buildComputePermissionsWithPermissionFilteringPolicies', () => {
  it('should take a base permission compute function and apply all permission filtering polices', async () => {
    // UIDs don't matter here since our mock functions always resolve
    const flags = await computePermissionsWithPolicies({ resourceId: v4(), userId: v4() });
    expect(flags).toEqual({
      read: true,
      delete: false,
      update: false,
      write: false
    });

    expect(mockCompute).toHaveBeenCalledTimes(1);
    expect(mockResolver).toHaveBeenCalledTimes(1);
    expect(mockPolicyNoWrite).toHaveBeenCalledTimes(1);
    expect(mockPolicyNoUpdate).toHaveBeenCalledTimes(1);
  });

  it('should skip remaining policies if all permission flags evaluate to false', async () => {
    const emptyFlags: ExampleResourceFlags = { read: false, write: false, delete: false, update: false };

    const mockIgnoredPolicy = jest.fn(
      (props: PermissionFilteringPolicyFnInput<ExampleResource, ExampleResourceFlags>) => {
        return Promise.resolve({ ...props.flags, delete: true });
      }
    );

    const mockAllFalsePolicy = jest.fn(
      (props: PermissionFilteringPolicyFnInput<ExampleResource, ExampleResourceFlags>) => {
        return Promise.resolve({ ...emptyFlags });
      }
    );

    const optimisedCompute = buildComputePermissionsWithPermissionFilteringPolicies({
      computeFn: mockCompute,
      resolver: mockResolver,
      // This policy adds a new permission flag, but the compute function resolved it as false
      policies: [mockAllFalsePolicy, mockIgnoredPolicy]
    });

    await expect(optimisedCompute({ resourceId: v4(), userId: v4() })).resolves.toEqual(emptyFlags);
    expect(mockIgnoredPolicy).not.toHaveBeenCalled();
    expect(mockAllFalsePolicy).toHaveBeenCalledTimes(1);
  });

  it('should not allow a policy to add new permission flags', async () => {
    const mockPolicyAddDelete = jest.fn(
      (props: PermissionFilteringPolicyFnInput<ExampleResource, ExampleResourceFlags>) => {
        return Promise.resolve({ ...props.flags, delete: true });
      }
    );

    const insecureCompute = buildComputePermissionsWithPermissionFilteringPolicies({
      computeFn: mockCompute,
      resolver: mockResolver,
      // This policy adds a new permission flag, but the compute function resolved it as false
      policies: [mockPolicyAddDelete]
    });

    const result = await insecureCompute({ resourceId: v4(), userId: v4() });

    expect(result.delete).toBe(false);
  });
  it('should check for admin access if the resource has a spaceId and pass this to the policies', async () => {
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
      policies: [mockPolicyNoWrite]
    });

    await mockedCompute({ resourceId: v4(), userId: v4() });

    expect(hasAccessToSpace).toHaveBeenCalled();
    expect(mockPolicyNoWrite).toHaveBeenCalledWith({
      isAdmin: true,
      flags: expect.any(Object),
      resource: expect.any(Object),
      userId: expect.any(String)
    });
  });
});
