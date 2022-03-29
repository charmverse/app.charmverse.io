
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { InputEnumToOptions } from 'components/common/form/InputEnumToOptions';
import { InputSearchContributorMultiple } from 'components/common/form/InputSearchContributor';
import { useContributors } from 'hooks/useContributors';
import { IPagePermissionWithAssignee, PagePermissionLevelType } from 'lib/permissions/pages/page-permission-interfaces';
import { PagePermissionLevelTitle } from 'lib/permissions/pages/page-permission-mapping';
import { getDisplayName } from 'lib/users';
import { filterObjectKeys } from 'lib/utilities/objects';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

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
  const [permissionLevelToAssign, setPermissionLevelToAssign] = useState<PagePermissionLevelType>('full_access');

  const [selectedUserIds, setSelectedUserIds] = useState<string []>([]);

  const userIdsToHide = existingPermissions.filter(permission => {
    return permission.user;
  }).map(permission => permission.user!.id);

  userIdsToHide.push(...(selectedUserIds));

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
