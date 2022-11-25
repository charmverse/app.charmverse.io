
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import type { SpaceOperation } from '@prisma/client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { BooleanSchema } from 'yup';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Loader from 'components/common/Loader';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import { usePreventReload } from 'hooks/usePreventReload';
import type { AssignablePermissionGroups } from 'lib/permissions/interfaces';
import type { SpacePermissionFlags } from 'lib/permissions/spaces/client';
import { AvailableSpacePermissions, spaceOperationLabels, spaceOperations } from 'lib/permissions/spaces/client';

const fields: Record<SpaceOperation, BooleanSchema> = spaceOperations().reduce((_schema: Record<SpaceOperation, BooleanSchema>, op) => {
  _schema[op] = yup.boolean();
  return _schema;
}, {} as any);

export const schema = yup.object(fields);

type FormValues = yup.InferType<typeof schema>

/**
 * @param callback Used to tell the parent the operation is complete. Useful for triggering refreshes
 */
interface Props {
  targetGroup: AssignablePermissionGroups;
  id: string;
  callback?: () => void;
}

export default function SpacePermissions ({ targetGroup, id, callback = () => null }: Props) {

  const [assignedPermissions, setAssignedPermissions] = useState<SpacePermissionFlags | null>(null);

  const space = useCurrentSpace();

  const isAdmin = useIsAdmin();
  // custom onChange is used for switches so isDirty from useForm doesn't change it value
  const [touched, setTouched] = useState<boolean>(false);
  const {
    handleSubmit,
    setValue,
    watch
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: assignedPermissions ?? new AvailableSpacePermissions().empty,
    resolver: yupResolver(schema)
  });

  usePreventReload(touched);

  const newValues = watch();

  async function refreshGroupPermissions () {

    if (!space) {
      setTimeout(() => {
        return refreshGroupPermissions();
      }, 1000);
    }
    else {
      const permissionFlags = await charmClient.queryGroupSpacePermissions({
        group: targetGroup,
        id,
        resourceId: space.id
      });
      spaceOperations().forEach(op => {
        setValue(op, permissionFlags[op]);
      });
      setAssignedPermissions(permissionFlags);
    }
  }

  useEffect(() => {
    refreshGroupPermissions();
  }, []);

  const settingsChanged = assignedPermissions !== null && (Object.entries(assignedPermissions) as [SpaceOperation, boolean][])
    .some(([operation, hasAccess]) => {
      const newValue = newValues[operation];
      return newValue !== hasAccess;
    });

  async function submitted (formValues: FormValues) {

    // Make sure we have existing permission set to compare against
    if (assignedPermissions && space) {
      const permissionsToAdd: SpaceOperation[] = [];
      const permissionsToRemove: SpaceOperation[] = [];

      // Only get new values
      (Object.entries(formValues) as [SpaceOperation, boolean][]).forEach(([operation, hasAccess]) => {
        if (assignedPermissions[operation] !== hasAccess) {

          if (hasAccess === true) {
            permissionsToAdd.push(operation);
          }
          else if (hasAccess === false) {
            permissionsToRemove.push(operation);
          }
        }
      });

      let newPermissionState = assignedPermissions;

      if (permissionsToAdd.length > 0) {
        newPermissionState = await charmClient.addSpacePermissions({
          forSpaceId: space.id,
          operations: permissionsToAdd,
          spaceId: targetGroup === 'space' ? id : undefined,
          roleId: targetGroup === 'role' ? id : undefined,
          userId: targetGroup === 'user' ? id : undefined
        });
      }

      if (permissionsToRemove.length > 0) {
        newPermissionState = await charmClient.removeSpacePermissions({
          forSpaceId: space.id,
          operations: permissionsToRemove,
          spaceId: targetGroup === 'space' ? id : undefined,
          roleId: targetGroup === 'role' ? id : undefined,
          userId: targetGroup === 'user' ? id : undefined
        });
      }
      // Force a refresh of rendered components
      setAssignedPermissions(newPermissionState);
      callback();
      setTouched(false);
    }
  }

  if (!assignedPermissions) {
    return (<Box sx={{ height: 100 }}><Loader size={20} sx={{ height: 600 }} /></Box>);
  }

  return (
    <div>
      <form onSubmit={handleSubmit(formValue => submitted(formValue))} style={{ margin: 'auto' }}>
        <Grid container direction='column' gap={2}>
          <Grid item xs>
            <Typography variant='body2' fontWeight='bold'>
              Workspace permissions
            </Typography>
            <Typography variant='caption'>
              {targetGroup === 'space' && (
                'Enabling permissions here will allow every workspace member to perform the relevant action, whatever their roles and permissions.'
              )}

              {targetGroup === 'role' && (
                'Workspace members with this role can perform all enabled actions, even if these actions are disabled at the workspace level.'
              )}

              {targetGroup === 'user' && (
                'This user can perform all enabled actions, even if these actions are disabled at the workspace level.'
              )}
            </Typography>

          </Grid>

          {
          (Object.keys(spaceOperationLabels) as SpaceOperation[]).map(operation => {

            const userCanPerformAction = assignedPermissions[operation];
            const actionLabel = spaceOperationLabels[operation];

            return (
              <Grid item container xs key={operation}>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={(
                      <Switch
                        disabled={!isAdmin}
                        defaultChecked={userCanPerformAction}
                        onChange={(ev) => {
                          const { checked: nowHasAccess } = ev.target;
                          setValue(operation, nowHasAccess);
                          setTouched(true);
                        }}
                      />
                    )}
                    label={actionLabel}
                  />
                </Grid>
                <Grid item xs={6}>

                  <Typography sx={{ height: '100%', justifyContent: 'center', display: 'flex', flexDirection: 'column' }} variant='body2'>
                    {
                      targetGroup === 'space' && newValues[operation] === true && (`All members of your workspace can ${actionLabel.toLowerCase()}`)
                    }

                    {
                      targetGroup === 'space' && newValues[operation] === false && (`Workspace members cannot ${actionLabel.toLowerCase()}`)
                    }

                    {
                      targetGroup === 'role' && newValues[operation] === true && (`Members with this role can ${actionLabel.toLowerCase()}`)
                    }

                    {
                      targetGroup === 'role' && newValues[operation] === false && (`Members with this role cannot ${actionLabel.toLowerCase()}`)
                    }

                    {
                      targetGroup === 'user' && newValues[operation] === true && (`This user can ${actionLabel.toLowerCase()}`)
                    }

                    {
                      targetGroup === 'user' && newValues[operation] === false && (`This user cannot ${actionLabel.toLowerCase()}`)
                    }
                    .

                  </Typography>

                </Grid>

              </Grid>
            );
          })
        }

          {
        isAdmin && (
          <Grid item xs>
            <Button disabled={!settingsChanged} type='submit' variant='contained' color='primary' sx={{ mr: 1 }}>Save</Button>

          </Grid>
        )
      }

        </Grid>

      </form>
    </div>
  );
}
