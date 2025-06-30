import type { PagePermission } from '@charmverse/core/prisma';
import type { AssignedPagePermission } from '@packages/core/permissions';
import { getPermissionAssignee } from '@packages/core/permissions';

type PermissionToMap = Omit<PagePermission, 'public' | 'roleId' | 'userId' | 'spaceId'> &
  Partial<Pick<PagePermission, 'public' | 'roleId' | 'userId' | 'spaceId'>> & {
    sourcePermission?: PagePermission | null;
  };
export function mapPagePermissionToAssignee({ permission }: { permission: PermissionToMap }): AssignedPagePermission {
  return {
    id: permission.id,
    pageId: permission.pageId,
    permissionLevel: permission.permissionLevel,
    sourcePermission: permission.sourcePermission,
    assignee: getPermissionAssignee(permission),
    allowDiscovery: permission.allowDiscovery
  };
}
