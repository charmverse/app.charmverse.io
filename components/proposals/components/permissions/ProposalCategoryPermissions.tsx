import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import type { ProposalCategory } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import Loader from 'components/common/LoadingComponent';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRoles } from 'hooks/useRoles';
import type {
  AssignedProposalCategoryPermission,
  AvailableProposalCategoryPermissionFlags
} from 'lib/permissions/proposals/interfaces';
import type { ProposalCategoryPermissionInput } from 'lib/permissions/proposals/upsertProposalCategoryPermission';

import { ProposalCategoryPermissionsAddRoles } from './ProposalCategoryPermissionAddRolesDialog';
import { ProposalCategoryRolePermissionRow } from './ProposalCategoryPermissionRow';
import type { BulkRoleProposalCategoryPermissionUpsert } from './shared';

/**
 * @permissions The actions a user can perform on a proposal category
 *
 * @abstract All other permissions inside this component are the actual assigned list of permissions to various groups for this proposal category
 */
type Props = {
  proposalCategory: ProposalCategory;
  permissions: AvailableProposalCategoryPermissionFlags;
};
function ProposalCategoryPermissions({ proposalCategory, permissions }: Props) {
  const { data, mutate: mutatePermissions } = useSWR(
    `/proposals/list-proposal-category-permissions-${proposalCategory.id}`,
    () => charmClient.permissions.proposals.listProposalCategoryPermissions(proposalCategory.id)
  );

  const { roles } = useRoles();
  const addRolesDialog = usePopupState({ variant: 'popover', popupId: 'add-roles-dialog' });

  const space = useCurrentSpace();
  async function deletePermission(id: string) {
    await charmClient.permissions.proposals.deleteProposalCategoryPermission(id);
    mutatePermissions((list) => list?.filter((p) => p.id !== id));
  }

  function getMutatedPermissionsList(
    newPermissions: AssignedProposalCategoryPermission[],
    permissionsList: AssignedProposalCategoryPermission[] = []
  ): AssignedProposalCategoryPermission[] {
    const alwaysList = permissionsList.slice();

    for (const upsertedPermission of newPermissions) {
      const existingPermissionIndex = alwaysList.findIndex((p) =>
        upsertedPermission.assignee.group === 'public'
          ? p.assignee.group === 'public'
          : p.assignee.group === upsertedPermission.assignee.group &&
            p.assignee.id === upsertedPermission.assignee.id &&
            p.proposalCategoryId === upsertedPermission.proposalCategoryId
      );

      if (existingPermissionIndex >= 0) {
        alwaysList.splice(existingPermissionIndex, 1, upsertedPermission);
      } else {
        alwaysList.push(upsertedPermission);
      }
    }

    return alwaysList;
  }

  async function addMultiplePermissions(input: BulkRoleProposalCategoryPermissionUpsert) {
    const newPermissions = await Promise.all(
      input.roleIds.map((id) =>
        charmClient.permissions.proposals.upsertProposalCategoryPermission({
          permissionLevel: input.permissionLevel,
          proposalCategoryId: proposalCategory.id,
          assignee: { group: 'role', id }
        })
      )
    );

    mutatePermissions((list) => getMutatedPermissionsList(newPermissions, list));
  }

  async function updatePermission(input: ProposalCategoryPermissionInput) {
    const newPermission = await charmClient.permissions.proposals.upsertProposalCategoryPermission(input);
    mutatePermissions((list) => getMutatedPermissionsList([newPermission], list));
  }

  const mappedPermissions = (data ?? []).reduce(
    (mapping, perm) => {
      if (perm.assignee.group === 'space') {
        mapping.space = perm as AssignedProposalCategoryPermission<'space'>;
      } else if (perm.assignee.group === 'role') {
        mapping.roles.push(perm as AssignedProposalCategoryPermission<'role'>);
      } else if (perm.assignee.group === 'public') {
        mapping.public = perm as AssignedProposalCategoryPermission<'public'>;
      }
      return mapping;
    },
    { space: undefined, roles: [], public: undefined } as {
      roles: AssignedProposalCategoryPermission<'role'>[];
      space: AssignedProposalCategoryPermission<'space'> | undefined;
      public: AssignedProposalCategoryPermission<'public'> | undefined;
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

  const allSpaceMembersHaveAccess = mappedPermissions.space?.permissionLevel === 'full_access';
  const canAddRoles =
    !allSpaceMembersHaveAccess &&
    permissions.manage_permissions &&
    (roles?.length ?? 0) > mappedPermissions.roles.length;

  const publicPermission = mappedPermissions.public;

  async function togglePublic() {
    if (publicPermission) {
      charmClient.permissions.proposals
        .deleteProposalCategoryPermission(publicPermission.id)
        .then(() => mutatePermissions((list) => list?.filter((p) => p.id !== publicPermission.id)));
    } else {
      charmClient.permissions.proposals
        .upsertProposalCategoryPermission({
          permissionLevel: 'view',
          proposalCategoryId: proposalCategory.id,
          assignee: { group: 'public' }
        })
        .then((newPermission) => mutatePermissions((list) => getMutatedPermissionsList([newPermission], list)));
    }
  }

  return (
    <Box data-test='category-permissions-dialog'>
      <Grid container spacing={2}>
        {/** Leaving this here as it will already work for making proposal categories public

        <Grid item xs={12}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography variant='body2'>Public category</Typography>
            <Switch
              data-test='toggle-public-page'
              checked={!!publicPermission}
              disabled={!permissions.manage_permissions}
              onChange={togglePublic}
            />
          </Box>
          <Typography variant='caption'>
            {!publicPermission
              ? 'Only space members with relevant permissions can view this category.'
              : 'Anyone on the web can view this category.'}
          </Typography>
        </Grid>
        <Divider sx={{ my: 2 }} />

           */}

        <Grid item xs={12}>
          <ProposalCategoryRolePermissionRow
            canEdit={permissions.manage_permissions}
            deletePermission={deletePermission}
            updatePermission={updatePermission}
            proposalCategoryId={proposalCategory.id}
            existingPermissionId={mappedPermissions.space?.id}
            defaultPermissionLevel={mappedPermissions.space?.permissionLevel}
            assignee={{ group: 'space', id: space.id }}
          />
        </Grid>
        {mappedPermissions.roles.map((rolePermission) => (
          <Grid item key={rolePermission.id} xs={12}>
            <ProposalCategoryRolePermissionRow
              canEdit={permissions.manage_permissions}
              deletePermission={deletePermission}
              updatePermission={updatePermission}
              proposalCategoryId={proposalCategory.id}
              existingPermissionId={rolePermission.id}
              defaultPermissionLevel={rolePermission.permissionLevel}
              assignee={{ group: 'role', id: rolePermission.assignee.id }}
            />
          </Grid>
        ))}

        {addRolesDialog.isOpen && (
          <Grid item xs>
            <Divider sx={{ my: 2 }} />
            <ProposalCategoryPermissionsAddRoles
              onSave={addMultiplePermissions}
              onClose={addRolesDialog.close}
              roleIdsToHide={mappedPermissions.roles.map((r) => r.assignee.id)}
            />
          </Grid>
        )}
        <Grid item xs={12} display='flex' justifyContent='flex-start'>
          {!addRolesDialog.isOpen ? (
            <Tooltip
              title={
                allSpaceMembersHaveAccess
                  ? 'All space members already have full access to this proposal category.'
                  : !canAddRoles
                  ? 'There are no roles available to add to this proposal category.'
                  : ''
              }
            >
              <div>
                <Button disabled={!canAddRoles} onClick={addRolesDialog.open} variant='text' color='secondary'>
                  + Add roles
                </Button>
              </div>
            </Tooltip>
          ) : (
            <Button onClick={addRolesDialog.close} variant='text' color='secondary'>
              Cancel
            </Button>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

type ProposalCategoryDialogProps = Props & {
  onClose: () => void;
  open: boolean;
};

export function ProposalCategoryPermissionsDialog({
  proposalCategory,
  onClose,
  open,
  permissions
}: ProposalCategoryDialogProps) {
  return (
    <Modal
      mobileDialog
      onClose={onClose}
      onClick={(e) => e.stopPropagation()}
      title={`${proposalCategory.title} permissions`}
      open={open}
    >
      <ProposalCategoryPermissions proposalCategory={proposalCategory} permissions={permissions} />
    </Modal>
  );
}
