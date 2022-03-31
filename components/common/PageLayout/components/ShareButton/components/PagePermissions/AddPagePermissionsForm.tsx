
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import charmClient, { ListSpaceRolesResponse } from 'charmClient';
import Button from 'components/common/Button';
import InputLabel from '@mui/material/InputLabel';
import InputEnumToOptions from 'components/common/form/InputEnumToOptions';
import { InputSearchContributorMultiple } from 'components/common/form/InputSearchContributor';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import { useContributors } from 'hooks/useContributors';
import { IPagePermissionWithAssignee, PagePermissionLevelType } from 'lib/permissions/pages/page-permission-interfaces';
import { permissionLevels } from 'lib/permissions/pages/page-permission-mapping';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import useRoles from 'components/settings/roles/hooks/useRoles';

export const schema = yup.object({
  id: yup.string(),
  type: yup.string(),
  permissionLevel: yup.string()
});

type FormValues = yup.InferType<typeof schema> & {type: 'role' | 'user', permissionLevel: PagePermissionLevelType}

interface Props {
  pageId: string
  existingPermissions: IPagePermissionWithAssignee []
  permissionsAdded?: () => any
}

export default function AddPagePermissionsForm ({ pageId, existingPermissions = [], permissionsAdded = () => {} }: Props) {

  const { roles } = useRoles();

  const [availableRoles, setAvailableRoles] = useState<ListSpaceRolesResponse[]>([]);

  const [permissionLevelToAssign, setPermissionLevelToAssign] = useState<PagePermissionLevelType>('full_access');

  const [selectedUserIds, setSelectedUserIds] = useState<string []>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string []>([]);

  useEffect(() => {

    if (roles) {
      setAvailableRoles(roles);
    }

  }, [roles]);

  const userIdsToHide = existingPermissions.filter(permission => {
    return permission.user;
  }).map(permission => permission.user!.id);

  const roleIdsToHide = existingPermissions.filter(permission => {
    return permission.role;
  }).map(permission => permission.role!.id);

  const {
    handleSubmit
  } = useForm<FormValues>();

  function createUserPermissions () {
    Promise.all([
      Promise.all(selectedUserIds.map(userId => {
        return charmClient.createPermission({
          pageId,
          userId,
          permissionLevel: permissionLevelToAssign!
        });
      })),
      Promise.all(selectedRoleIds.map(roleId => {
        return charmClient.createPermission({
          pageId,
          roleId,
          permissionLevel: permissionLevelToAssign!
        });
      }))
    ]).then(() => permissionsAdded());
  }

  const { custom, ...permissionsWithoutCustom } = permissionLevels as Record<string, string>;

  return (
    <div>
      <form onSubmit={handleSubmit(createUserPermissions)} style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
        <Grid container direction='column' spacing={3}>

          <Grid container item direction='row' justifyContent='space-between' alignItems='center'>
            <Grid item xs={8}>
              <InputEnumToOptions
                onChange={(newAccessLevel) => setPermissionLevelToAssign(newAccessLevel as PagePermissionLevelType)}
                keyAndLabel={permissionsWithoutCustom}
                defaultValue={permissionLevelToAssign}
              />

            </Grid>
            <Grid item xs={4}>
              <Button
                disableElevation
                fullWidth
                sx={{ height: '100%', py: 1 }}
                type='submit'
                disabled={!permissionLevelToAssign || (selectedUserIds.length === 0 && selectedRoleIds.length === 0)}
              >
                Invite
              </Button>
            </Grid>
          </Grid>
          <Grid item>
            <InputLabel>Users</InputLabel>
            <InputSearchContributorMultiple
              onChange={setSelectedUserIds}
              filter={{
                mode: 'exclude',
                userIds: userIdsToHide
              }}
            />
          </Grid>

          {
            roleIdsToHide.length < availableRoles.length && (
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
            )
          }

        </Grid>
      </form>
    </div>
  );
}
