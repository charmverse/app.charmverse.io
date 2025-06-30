import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { InvalidInputError } from '@packages/core/errors';
import type { AssignedPagePermission, PagePermissionAssignmentByValues } from '@packages/core/permissions';

import { listPagePermissions } from '../listPagePermissions';

describe('listPagePermissions', () => {
  it('should return all the assigned permissions for a specific page along with their source permission', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const page = await testUtilsPages
      .generatePage({
        createdBy: user.id,
        spaceId: space.id,
        pagePermissions: [
          {
            permissionLevel: 'full_access',
            assignee: { group: 'user', id: user.id }
          },
          {
            permissionLevel: 'full_access',
            assignee: { group: 'space', id: space.id }
          }
        ]
      })
      .then((p) => testUtilsPages.getPageWithPermissions(p.id));

    const childPage = await testUtilsPages
      .generatePage({
        createdBy: user.id,
        spaceId: space.id,
        parentId: page.id,
        pagePermissions: page.permissions.map((p) => {
          const group = p.spaceId ? 'space' : 'user';

          const assignment: PagePermissionAssignmentByValues & { inheritedFromPermission: string } = {
            inheritedFromPermission: p.id,
            permissionLevel: p.permissionLevel,
            assignee: {
              group,
              id: (group === 'space' ? p.spaceId : p.userId) as string
            }
          };
          return assignment;
        })
      })
      .then((p) => testUtilsPages.getPageWithPermissions(p.id));

    // Quick check to make sure everything got generated
    expect(page.permissions.length).toBe(2);
    expect(childPage.permissions.length).toBe(2);

    // Actual test
    const childPagePermissions = await listPagePermissions({
      resourceId: childPage.id
    });

    const { sourcePermission, ...sourceSpacePermission } = page.permissions.find((p) => !!p.spaceId) ?? {};
    const { sourcePermission: _sourcePermission, ...sourceUserPermission } =
      page.permissions.find((p) => !!p.userId) ?? {};

    expect(childPagePermissions.length).toBe(2);
    expect(childPagePermissions).toEqual(
      expect.arrayContaining<AssignedPagePermission>([
        expect.objectContaining({
          id: expect.any(String),
          pageId: childPage.id,
          permissionLevel: 'full_access',
          assignee: {
            group: 'space',
            id: space.id
          },
          sourcePermission: sourceSpacePermission
        }),
        expect.objectContaining({
          id: expect.any(String),
          pageId: childPage.id,
          permissionLevel: 'full_access',
          assignee: {
            group: 'user',
            id: user.id
          },
          sourcePermission: sourceUserPermission
        })
      ])
    );
  });
  it('should throw an error if pageId is undefined', async () => {
    await expect(listPagePermissions({ resourceId: undefined as any })).rejects.toBeInstanceOf(InvalidInputError);
  });
});
