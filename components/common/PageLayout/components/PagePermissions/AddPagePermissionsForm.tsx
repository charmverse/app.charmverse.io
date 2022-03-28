
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { InputEnumToOptions } from 'components/common/form/InputEnumToOptions';
import { InputSearchContributor } from 'components/common/form/InputSearchContributor';
import { useContributors } from 'hooks/useContributors';
import { PagePermissionLevelTitle } from 'lib/permissions/pages/page-permission-mapping';
import { IPagePermissionWithAssignee, PagePermissionLevelType } from 'lib/permissions/pages/page-permission-interfaces';
import { getDisplayName } from 'lib/users';
import { useEffect, useState } from 'react';
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
}

export function AddPagePermissionsForm ({ pageId }: Props) {

  const [contributors] = useContributors();
  const [pagePermissions, setPagePermissions] = useState<IPagePermissionWithAssignee []>([]);

  const [selectedUserIds, setSelectedUserIds] = useState<string []>([]);

  const userIdsToHide = pagePermissions.filter(permission => {
    console.log('Inside filtering loop');
    return permission.user;
  }).map(permission => permission.id);

  userIdsToHide.push(...(selectedUserIds));

  const {
    handleSubmit
  } = useForm<FormValues>();

  useEffect(() => {
    refreshPagePermissions();
  }, [pageId]);

  function refreshPagePermissions () {
    charmClient.listPagePermissions(pageId)
      .then(foundPagePermissions => {
        console.log('Found permissions', foundPagePermissions);
        setPagePermissions(foundPagePermissions);
      });
  }

  /*
  async function submitted (value: FormValues) {
  }
  */

  function addContributorToPermissions (userId: string) {
    setSelectedUserIds([...selectedUserIds, userId]);
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
      <form onSubmit={handleSubmit(formValue => submitted(formValue))} style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <InputSearchContributor
              onChange={addContributorToPermissions}
              filter={{
                mode: 'exclude',
                userIds: userIdsToHide
              }}
            />
          </Grid>

          <Grid item>
            <InputEnumToOptions
              keyAndLabel={PagePermissionLevelTitle}
            />
          </Grid>

          <Grid item>
            <Button type='submit'>Add permissions</Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}
