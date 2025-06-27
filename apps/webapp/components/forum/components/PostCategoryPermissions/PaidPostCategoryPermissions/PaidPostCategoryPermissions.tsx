import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import type { AssignedPostCategoryPermission } from '@packages/core/permissions';
import { usePopupState } from 'material-ui-popup-state/hooks';

import { Button } from 'components/common/Button';
import { usePostCategoryPermissions } from 'components/forum/hooks/usePostCategoryPermissions';
import { usePostCategoryPermissionsList } from 'components/forum/hooks/usePostCategoryPermissionsList';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRoles } from 'hooks/useRoles';

import { AddRolesRow } from '../components/AddRolesRow';
import { PostCategoryRolePermissionRow } from '../components/PostCategoryPermissionRow';

import { PostCategoryPermissionsAddRoles } from './PostCategoryPermissionAddRolesDialog';

/**
 * @permissions The actions a user can perform on a post category
 *
 * @abstract All other permissions inside this component are the actual assigned list of permissions to various groups for this post category
 */
type Props = {
  postCategoryId: string;
};
export function PaidPostCategoryPermissions({ postCategoryId }: Props) {
  const { roles } = useRoles();
  const addRolesDialog = usePopupState({ variant: 'popover', popupId: 'add-roles-dialog' });

  const { space } = useCurrentSpace();

  const { permissions: currentUserPermissions } = usePostCategoryPermissions(postCategoryId);

  const {
    permissionsList = [],
    deletePermission,
    updatePermission,
    addRolePermissions
  } = usePostCategoryPermissionsList({ postCategoryId });

  const spacePermission = permissionsList.find((p) => p.assignee.group === 'space');
  const rolePermissions = permissionsList.filter(
    (p) => p.assignee.group === 'role'
  ) as AssignedPostCategoryPermission<'role'>[];

  const assignableRolesExist = (roles?.length ?? 0) > rolePermissions.length;
  const canAddRoles = currentUserPermissions?.manage_permissions && assignableRolesExist;

  const addRolesRowTooltip = !currentUserPermissions?.manage_permissions
    ? 'You cannot manage permissions for this category'
    : roles?.length === 0
      ? 'Create roles for this space to assign permissions'
      : !assignableRolesExist
        ? 'All available roles already have permissions in this post category.'
        : '';

  return (
    <Grid container>
      <Grid size={12}>
        <PostCategoryRolePermissionRow
          canEdit={!!currentUserPermissions?.manage_permissions}
          postCategoryId={postCategoryId}
          existingPermissionId={spacePermission?.id}
          permissionLevel={spacePermission?.permissionLevel}
          assignee={{ group: 'space', id: space?.id as string }}
          deletePermission={deletePermission}
          updatePermission={updatePermission}
        />
      </Grid>
      {rolePermissions.map((rolePermission) => (
        <Grid key={rolePermission.id} size={12}>
          <PostCategoryRolePermissionRow
            canEdit={!!currentUserPermissions?.manage_permissions}
            postCategoryId={postCategoryId}
            existingPermissionId={rolePermission.id}
            permissionLevel={rolePermission.permissionLevel}
            defaultPermissionLevel={spacePermission?.permissionLevel}
            assignee={{ group: 'role', id: rolePermission.assignee.id }}
            deletePermission={deletePermission}
            updatePermission={updatePermission}
          />
        </Grid>
      ))}

      {addRolesDialog.isOpen && (
        <Grid size='grow'>
          <Divider sx={{ my: 2 }} />
          <PostCategoryPermissionsAddRoles
            onSave={(value) => addRolePermissions({ input: value, targetPostCategoryId: postCategoryId })}
            onClose={addRolesDialog.close}
            roleIdsToHide={rolePermissions.map((p) => p.assignee.id)}
          />
        </Grid>
      )}
      <Grid size={12} display='flex' justifyContent='flex-start'>
        {!addRolesDialog.isOpen ? (
          <AddRolesRow
            disabled={!canAddRoles}
            disabledTooltip={addRolesRowTooltip ?? ''}
            onClick={addRolesDialog.open}
          />
        ) : (
          <Button onClick={addRolesDialog.close} variant='text' color='secondary'>
            Cancel
          </Button>
        )}
      </Grid>
    </Grid>
  );
}
