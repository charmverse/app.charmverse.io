import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Divider, FormControlLabel, Grid, Switch, Tooltip, Typography } from '@mui/material';
import { SpaceOperation } from '@prisma/client';
import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import useSWR, { mutate } from 'swr';
import type { BooleanSchema } from 'yup';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePreventReload } from 'hooks/usePreventReload';
import type { AssignablePermissionGroups } from 'lib/permissions/interfaces';
import type { SpacePermissionFlags } from 'lib/permissions/spaces/client';
import { AvailableSpacePermissions } from 'lib/permissions/spaces/client';

const spaceOperations = Object.keys(SpaceOperation).filter(
  (op) => op !== 'createVote' && op !== 'createForumCategory'
) as Exclude<SpaceOperation, 'createVote' | 'createForumCategory'>[];

const fields: Record<SpaceOperation, BooleanSchema> = spaceOperations.reduce(
  (_schema: Record<SpaceOperation, BooleanSchema>, op) => {
    _schema[op] = yup.boolean();
    return _schema;
  },
  {} as any
);

export const schema = yup.object(fields);

type FormValues = yup.InferType<typeof schema>;

/**
 * @param callback Used to tell the parent the operation is complete. Useful for triggering refreshes
 */
interface Props {
  targetGroup: AssignablePermissionGroups;
  id: string;
  callback?: () => void;
}

export function RolePermissions({ targetGroup, id, callback = () => null }: Props) {
  const [assignedPermissions, setAssignedPermissions] = useState<SpacePermissionFlags | null>(null);

  const space = useCurrentSpace();

  const isAdmin = useIsAdmin();
  // custom onChange is used for switches so isDirty from useForm doesn't change it value
  const [touched, setTouched] = useState<boolean>(false);
  const { handleSubmit, setValue } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: assignedPermissions ?? new AvailableSpacePermissions().empty,
    resolver: yupResolver(schema)
  });

  const { data: memberPermissionFlags } = useSWR(
    targetGroup !== 'space' && space ? `member-permissions-${space.id}` : null,
    () =>
      charmClient.queryGroupSpacePermissions({
        group: 'space',
        id: space?.id as string,
        resourceId: space?.id as string
      })
  );

  usePreventReload(touched);

  useEffect(() => {
    if (space) {
      refreshGroupPermissions(space.id);
    }
  }, [space]);

  async function refreshGroupPermissions(resourceId: string) {
    const permissionFlags = await charmClient.queryGroupSpacePermissions({
      group: targetGroup,
      id,
      resourceId
    });
    spaceOperations.forEach((op) => {
      setValue(op, permissionFlags[op]);
    });
    setAssignedPermissions(permissionFlags);
  }

  async function submitted(formValues: FormValues) {
    // Make sure we have existing permission set to compare against
    if (assignedPermissions && space) {
      const permissionsToAdd: SpaceOperation[] = [];
      const permissionsToRemove: SpaceOperation[] = [];

      // Only get new values
      (Object.entries(formValues) as [SpaceOperation, boolean][]).forEach(([operation, hasAccess]) => {
        if (assignedPermissions[operation] !== hasAccess) {
          if (hasAccess === true) {
            permissionsToAdd.push(operation);
          } else if (hasAccess === false) {
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
      // update the cache of other rows
      if (targetGroup === 'space') {
        mutate(`member-permissions-${space.id}`);
      }
    }
  }

  return (
    <div data-test={`space-permissions-form-${targetGroup}`}>
      <form onSubmit={handleSubmit((formValue) => submitted(formValue))} style={{ margin: 'auto' }}>
        <Grid container gap={2}>
          <Grid item xs={12} md={12}>
            <Typography variant='body2' fontWeight='bold'>
              Pages
            </Typography>
            <PermissionToggle
              data-test='space-operation-createPage'
              label='Create new pages'
              defaultChecked={assignedPermissions?.createPage}
              disabled={!isAdmin}
              memberChecked={targetGroup !== 'space' ? memberPermissionFlags?.createPage : false}
              onChange={(ev) => {
                const { checked: nowHasAccess } = ev.target;
                setValue('createPage', nowHasAccess);
                setTouched(true);
              }}
            />
            <Divider sx={{ mt: 1, mb: 2 }} />
            <Typography variant='body2' fontWeight='bold'>
              Bounties
            </Typography>
            <PermissionToggle
              data-test='space-operation-createBounty'
              label='Create new bounties'
              defaultChecked={assignedPermissions?.createBounty}
              disabled={!isAdmin}
              memberChecked={targetGroup !== 'space' ? memberPermissionFlags?.createBounty : false}
              onChange={(ev) => {
                const { checked: nowHasAccess } = ev.target;
                setValue('createBounty', nowHasAccess);
                setTouched(true);
              }}
            />
            <Divider sx={{ mt: 1, mb: 2 }} />
            <Typography variant='body2' fontWeight='bold'>
              Proposals
            </Typography>
            <PermissionToggle
              data-test='space-operation-reviewProposals'
              label='Review proposals'
              defaultChecked={assignedPermissions?.reviewProposals}
              memberChecked={targetGroup !== 'space' ? memberPermissionFlags?.reviewProposals : false}
              disabled={!isAdmin}
              onChange={(ev) => {
                const { checked: nowHasAccess } = ev.target;
                setValue('reviewProposals', nowHasAccess);
                setTouched(true);
              }}
            />
            {targetGroup !== 'space' && (
              <>
                <Divider sx={{ mt: 1, mb: 2 }} />
                <Typography variant='body2' fontWeight='bold'>
                  Forums
                </Typography>
                <PermissionToggle
                  data-test='space-operation-moderateForums'
                  label='Moderate all forum categories'
                  defaultChecked={assignedPermissions?.moderateForums}
                  memberChecked={memberPermissionFlags?.moderateForums}
                  disabled={!isAdmin}
                  onChange={(ev) => {
                    const { checked: nowHasAccess } = ev.target;
                    setValue('moderateForums', nowHasAccess);
                    setTouched(true);
                  }}
                />
              </>
            )}

            {isAdmin && (
              <Box mt={2}>
                <Button
                  size='small'
                  data-test='submit-space-permission-settings'
                  disabled={!touched}
                  type='submit'
                  variant='contained'
                  color='primary'
                >
                  Save
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </form>
    </div>
  );
}

function PermissionToggle(props: {
  label: string;
  defaultChecked?: boolean;
  disabled: boolean;
  memberChecked?: boolean; // if this permission is inherited from the Member role
  ['data-test']?: string;
  onChange: (ev: ChangeEvent<HTMLInputElement>) => void;
}) {
  const disabled = props.disabled || props.memberChecked === true;
  const defaultChecked = props.memberChecked || props.defaultChecked;
  return (
    <FormControlLabel
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        margin: 0
      }}
      control={
        typeof props.defaultChecked === 'boolean' && typeof props.memberChecked === 'boolean' ? (
          <Tooltip title={props.memberChecked ? 'Disable this permission from the member role to change it here' : ''}>
            <span>
              <Switch
                key={`${props.label}-${defaultChecked}`}
                data-test={props['data-test']}
                disabled={disabled}
                defaultChecked={defaultChecked}
                onChange={props.onChange}
              />
            </span>
          </Tooltip>
        ) : (
          // placeholder element while loading
          <Switch sx={{ visibility: 'hidden' }} disabled={true} />
        )
      }
      label={props.label}
      labelPlacement='start'
    />
  );
}
