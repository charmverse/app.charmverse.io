import type {
  AssignedPagePermission,
  PagePermissionAssignment,
  TargetPermissionGroup
} from '@charmverse/core/permissions';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import InputEnumToOptions from 'components/common/form/InputEnumToOptions';
import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import Loader from 'components/common/Loader';
import { useRoles } from 'hooks/useRoles';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ApplicablePagePermissionLevel } from 'lib/permissions/pages/labels';
import { pagePermissionLevels } from 'lib/permissions/pages/labels';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

export const schema = yup.object({
  id: yup.string(),
  type: yup.string(),
  permissionLevel: yup.string()
});

type FormValues = yup.InferType<typeof schema> & {
  type: 'role' | 'user';
  permissionLevel: ApplicablePagePermissionLevel;
};

interface Props {
  pageId: string;
  existingPermissions: AssignedPagePermission[];
  permissionsAdded?: () => any;
}

export default function AddPagePermissionsForm({
  pageId,
  existingPermissions = [],
  permissionsAdded = () => {}
}: Props) {
  const { roles } = useRoles();

  const [availableRoles, setAvailableRoles] = useState<ListSpaceRolesResponse[]>([]);
  const { showMessage } = useSnackbar();

  const [permissionLevelToAssign, setPermissionLevelToAssign] = useState<ApplicablePagePermissionLevel>('full_access');

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const [permissionBeingAdded, setPermissionBeingAdded] = useState<{ index: number; total: number } | null>(null);

  useEffect(() => {
    if (roles) {
      setAvailableRoles(roles);
    }
  }, [roles]);

  const userIdsToHide = existingPermissions
    .filter((permission) => permission.assignee.group === 'user')
    .map((permission) => {
      return (permission.assignee as TargetPermissionGroup<'user'>).id;
    });

  const roleIdsToHide = existingPermissions
    .filter((permission) => permission.assignee.group === 'role')
    .map((permission) => {
      return (permission.assignee as TargetPermissionGroup<'role'>).id;
    });

  const { handleSubmit } = useForm<FormValues>();

  async function createUserPermissions() {
    const permissionsToCreate: PagePermissionAssignment[] = [
      ...selectedUserIds.map((userId) => {
        return {
          pageId,
          permission: {
            permissionLevel: permissionLevelToAssign!,
            assignee: {
              group: 'user',
              id: userId
            }
          }
        } as PagePermissionAssignment;
      }),
      ...selectedRoleIds.map((roleId) => {
        return {
          pageId,
          permission: {
            permissionLevel: permissionLevelToAssign!,
            assignee: {
              group: 'role',
              id: roleId
            }
          }
        } as PagePermissionAssignment;
      })
    ];

    async function recursivePermissionAssign({
      currentIndex = 0,
      total,
      permissions
    }: {
      currentIndex?: number;
      total: number;
      permissions: PagePermissionAssignment[];
    }): Promise<true> {
      if (permissions.length === 0) {
        setPermissionBeingAdded(null);
        return true;
      }

      currentIndex += 1;

      setPermissionBeingAdded({
        index: currentIndex,
        total
      });

      await charmClient.createPermission(permissions[0]);

      permissions.shift();

      return recursivePermissionAssign({ currentIndex, total, permissions });
    }

    try {
      await recursivePermissionAssign({
        total: permissionsToCreate.length,
        permissions: permissionsToCreate
      });

      permissionsAdded();
    } catch (err) {
      showMessage((err as any).message ?? 'Something went wrong', 'error');
      setPermissionBeingAdded(null);
    }
  }

  // eslint-disable-next-line camelcase

  return (
    <div>
      <form onSubmit={handleSubmit(createUserPermissions)} style={{ margin: 'auto' }}>
        <Grid container direction='column' spacing={3}>
          <Grid container item direction='row' justifyContent='space-between' alignItems='center'>
            <Grid item xs={8}>
              <InputEnumToOptions
                onChange={(newAccessLevel) =>
                  setPermissionLevelToAssign(newAccessLevel as ApplicablePagePermissionLevel)
                }
                keyAndLabel={pagePermissionLevels}
                defaultValue={permissionLevelToAssign}
              />
            </Grid>
            <Grid item xs={4}>
              <Button
                disableElevation
                fullWidth
                sx={{ height: '100%', py: '10px', borderTopLeftRadius: '0px', borderBottomLeftRadius: '0px' }}
                type='submit'
                disabled={
                  !permissionLevelToAssign ||
                  (selectedUserIds.length === 0 && selectedRoleIds.length === 0) ||
                  permissionBeingAdded
                }
              >
                Invite
              </Button>
            </Grid>
          </Grid>

          {permissionBeingAdded && (
            <Grid item>
              <Alert severity='info' sx={{ '& .MuiAlert-message': { flex: 1 } }}>
                <Loader
                  position='right'
                  sx={{ display: 'inline', ' & span': { ml: 2 }, '& div': { width: '100%', display: 'flex' } }}
                  size={20}
                  message={`Adding permission ${permissionBeingAdded.index} / ${permissionBeingAdded.total}`}
                />
              </Alert>
            </Grid>
          )}

          <Grid item>
            <InputLabel>Users</InputLabel>
            <InputSearchMemberMultiple
              allowEmail
              onChange={setSelectedUserIds}
              placeholder='Search for user or invite guests by email'
              filter={{
                mode: 'exclude',
                userIds: userIdsToHide
              }}
            />
          </Grid>

          {roleIdsToHide.length < availableRoles.length && (
            <Grid item>
              <InputLabel>Roles</InputLabel>
              <InputSearchRoleMultiple
                onChange={setSelectedRoleIds}
                filter={{
                  mode: 'exclude',
                  userIds: roleIdsToHide
                }}
              />
            </Grid>
          )}
        </Grid>
      </form>
    </div>
  );
}
