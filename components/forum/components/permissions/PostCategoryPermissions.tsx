import { Divider } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import type { PostCategory } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import Loader from 'components/common/LoadingComponent';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useRoles from 'hooks/useRoles';
import type {
  AssignedPostCategoryPermission,
  AvailablePostCategoryPermissionFlags
} from 'lib/permissions/forum/interfaces';
import type { PostCategoryPermissionInput } from 'lib/permissions/forum/upsertPostCategoryPermission';

import { PostCategoryPermissionsAddRoles } from './PostCategoryPermissionAddRolesDialog';
import { PostCategoryRolePermissionRow } from './PostCategoryPermissionRow';
import type { BulkRolePostCategoryPermissionUpsert } from './shared';

/**
 * @permissions The actions a user can perform on a post category
 *
 * @abstract All other permissions inside this component are the actual assigned list of permissions to various groups for this post category
 */
type Props = {
  postCategory: PostCategory;
  permissions: AvailablePostCategoryPermissionFlags;
};
function PostCategoryPermissions({ postCategory, permissions }: Props) {
  const {
    data,
    isLoading,
    mutate: mutatePermissions
  } = useSWR(`/api/forum/list-post-category-permissions-${postCategory.id}`, () =>
    charmClient.permissions.listPostCategoryPermissions(postCategory.id)
  );

  const { roles } = useRoles();
  const addRolesDialog = usePopupState({ variant: 'popover', popupId: 'add-roles-dialog' });

  const space = useCurrentSpace();
  async function deletePermission(id: string) {
    await charmClient.permissions.deletePostCategoryPermission(id);
    mutatePermissions((list) => list?.filter((p) => p.id !== id));
  }

  function getMutatedPermissionsList(
    newPermissions: AssignedPostCategoryPermission[],
    permissionsList: AssignedPostCategoryPermission[] = []
  ): AssignedPostCategoryPermission[] {
    const alwaysList = permissionsList.slice();

    for (const upsertedPermission of newPermissions) {
      const existingPermissionIndex = alwaysList.findIndex((p) =>
        upsertedPermission.assignee.group === 'public'
          ? p.assignee.group === 'public'
          : p.assignee.group === upsertedPermission.assignee.group &&
            p.assignee.id === upsertedPermission.assignee.id &&
            p.postCategoryId === upsertedPermission.postCategoryId
      );

      if (existingPermissionIndex >= 0) {
        alwaysList.splice(existingPermissionIndex, 1, upsertedPermission);
      } else {
        alwaysList.push(upsertedPermission);
      }
    }

    return alwaysList;
  }

  async function addMultiplePermissions(input: BulkRolePostCategoryPermissionUpsert) {
    const newPermissions = await Promise.all(
      input.roleIds.map((id) =>
        charmClient.permissions.upsertPostCategoryPermission({
          permissionLevel: input.permissionLevel,
          postCategoryId: postCategory.id,
          assignee: { group: 'role', id }
        })
      )
    );

    mutatePermissions((list) => getMutatedPermissionsList(newPermissions, list));
  }

  async function updatePermission(input: PostCategoryPermissionInput) {
    const newPermission = await charmClient.permissions.upsertPostCategoryPermission(input);
    mutatePermissions((list) => getMutatedPermissionsList([newPermission], list));
  }

  const mappedPermissions = (data ?? []).reduce(
    (mapping, perm) => {
      if (perm.assignee.group === 'space') {
        mapping.space = perm as AssignedPostCategoryPermission<'space'>;
      } else if (perm.assignee.group === 'role') {
        mapping.roles.push(perm as AssignedPostCategoryPermission<'role'>);
      } else if (perm.assignee.group === 'public') {
        mapping.public = perm as AssignedPostCategoryPermission<'public'>;
      }
      return mapping;
    },
    { space: undefined, roles: [], public: undefined } as {
      roles: AssignedPostCategoryPermission<'role'>[];
      space: AssignedPostCategoryPermission<'space'> | undefined;
      public: AssignedPostCategoryPermission<'public'> | undefined;
    }
  );

  mappedPermissions.roles = mappedPermissions.roles.sort((a, b) => a.assignee.id.localeCompare(b.assignee.id));

  if (!data || !space) {
    return (
      <Box sx={{ my: 2 }}>
        <Loader />
      </Box>
    );
  }

  const canAddRoles = permissions.manage_permissions && (roles?.length ?? 0) > mappedPermissions.roles.length;

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <PostCategoryRolePermissionRow
            canEdit={permissions.manage_permissions}
            deletePermission={deletePermission}
            updatePermission={updatePermission}
            postCategoryId={postCategory.id}
            existingPermissionId={mappedPermissions.space?.id}
            defaultPermissionLevel={mappedPermissions.space?.permissionLevel}
            assignee={{ group: 'space', id: space.id }}
          />
        </Grid>
        {mappedPermissions.roles.map((rolePermission) => (
          <Grid item key={rolePermission.id} xs={12}>
            <PostCategoryRolePermissionRow
              canEdit={permissions.manage_permissions}
              deletePermission={deletePermission}
              updatePermission={updatePermission}
              postCategoryId={postCategory.id}
              existingPermissionId={rolePermission.id}
              defaultPermissionLevel={rolePermission.permissionLevel}
              assignee={{ group: 'role', id: rolePermission.assignee.id }}
            />
          </Grid>
        ))}

        {addRolesDialog.isOpen && (
          <Grid item xs>
            <Divider sx={{ my: 2 }} />
            <PostCategoryPermissionsAddRoles
              onSave={addMultiplePermissions}
              onClose={addRolesDialog.close}
              roleIdsToHide={mappedPermissions.roles.map((r) => r.assignee.id)}
            />
          </Grid>
        )}

        {canAddRoles && (
          <Grid item xs={12} display='flex' justifyContent='flex-start'>
            {!addRolesDialog.isOpen ? (
              <Button onClick={addRolesDialog.open} variant='text' color='secondary'>
                + Add roles
              </Button>
            ) : (
              <Button onClick={addRolesDialog.close} variant='text' color='secondary'>
                Cancel
              </Button>
            )}
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

type PostCategoryDialogProps = Props & {
  onClose: () => void;
  open: boolean;
};

export function PostCategoryPermissionsDialog({ postCategory, onClose, open, permissions }: PostCategoryDialogProps) {
  return (
    <Modal onClose={onClose} title={`${postCategory.name} permissions`} open={open}>
      <PostCategoryPermissions postCategory={postCategory} permissions={permissions} />
    </Modal>
  );
}
