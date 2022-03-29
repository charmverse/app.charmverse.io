
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { InputEnumToOptions } from 'components/common/form/InputEnumToOptions';
import { InputSearchContributorMultiple } from 'components/common/form/InputSearchContributor';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import { useContributors } from 'hooks/useContributors';
import { IPagePermissionWithAssignee, PagePermissionLevelType } from 'lib/permissions/pages/page-permission-interfaces';
import { PagePermissionLevelTitle } from 'lib/permissions/pages/page-permission-mapping';
import { getDisplayName } from 'lib/users';
import { filterObjectKeys } from 'lib/utilities/objects';
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

export function AddPagePermissionsForm ({ pageId, existingPermissions = [], permissionsAdded = () => {} }: Props) {

  const [contributors] = useContributors();

  const { roles, listRoles } = useRoles();

  const [permissionLevelToAssign, setPermissionLevelToAssign] = useState<PagePermissionLevelType>('full_access');

  const [selectedUserIds, setSelectedUserIds] = useState<string []>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string []>([]);

  useEffect(() => {
    listRoles();
  }, []);

  const userIdsToHide = existingPermissions.filter(permission => {
    return permission.user;
  }).map(permission => permission.user!.id);

  userIdsToHide.push(...(selectedUserIds));

  const roleIdsToHide = existingPermissions.filter(permission => {
    return permission.role;
  }).map(permission => permission.role!.id);

  roleIdsToHide.push(...selectedRoleIds);

  const {
    handleSubmit
  } = useForm<FormValues>();

  function createUserPermissions () {
    Promise.all(selectedUserIds.map(userId => {
      return charmClient.createPermission({
        pageId,
        userId,
        permissionLevel: permissionLevelToAssign!
      });
    })).then(() => permissionsAdded());
  }

  console.log('To hide', userIdsToHide);

  return (
    <div>
      {
        selectedUserIds?.length > 0 && (
          selectedUserIds.map(userId => {

            const user = contributors.find(contributor => contributor.id === userId);

            if (user) {
              return (
                <Box key={userId}>
                  {getDisplayName(user)}
                </Box>
              );
            }
            else {
              return null;
            }

          })
        )
      }
      <form onSubmit={handleSubmit(createUserPermissions)} style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
        <Grid container direction='column' spacing={3}>
          {
            userIdsToHide.length < contributors.length && (
              <Grid item>
                <InputSearchContributorMultiple
                  onChange={setSelectedUserIds}
                  filter={{
                    mode: 'exclude',
                    userIds: userIdsToHide
                  }}
                />
              </Grid>
            )
          }

          {
            roleIdsToHide.length < roles.length && (
              <Grid item>
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

          <Grid item>
            <InputEnumToOptions
              onChange={(newAccessLevel) => setPermissionLevelToAssign(newAccessLevel as PagePermissionLevelType)}
              keyAndLabel={filterObjectKeys(PagePermissionLevelTitle, 'exclude', ['custom'])}
              defaultValue={permissionLevelToAssign}
            />
          </Grid>

          <Grid item>
            <Button type='submit' disabled={!permissionLevelToAssign || (selectedUserIds.length === 0)}>Add permissions</Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}
