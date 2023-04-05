import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Divider, FormControlLabel, Grid, Switch, Tooltip, Typography } from '@mui/material';
import { SpaceOperation } from '@prisma/client';
import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { mutate } from 'swr';
import useSWR from 'swr/immutable';
import type { BooleanSchema } from 'yup';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { PostCategoryRolePermissionRow } from 'components/forum/components/permissions/PostCategoryPermissionRow';
import { ProposalCategoryRolePermissionRow } from 'components/proposals/components/permissions/ProposalCategoryPermissionRow';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePreventReload } from 'hooks/usePreventReload';
import type { PostCategoryPermissionInput } from 'lib/permissions/forum/upsertPostCategoryPermission';
import type { AssignablePermissionGroups } from 'lib/permissions/interfaces';
import type { ProposalCategoryPermissionInput } from 'lib/permissions/proposals/upsertProposalCategoryPermission';
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
  targetGroup: Extract<AssignablePermissionGroups, 'space' | 'role'>;
  id: string;
  callback?: () => void;
}

export function RolePermissions({ targetGroup, id, callback = () => null }: Props) {
  const space = useCurrentSpace();
  const { categories: proposalCategories = [] } = useProposalCategories();
  const { categories: forumCategories = [] } = useForumCategories();
  const isAdmin = useIsAdmin();
  const [assignedPermissions, setAssignedPermissions] = useState<SpacePermissionFlags | null>(null);
  // custom onChange is used for switches so isDirty from useForm doesn't change it value
  const [touched, setTouched] = useState<boolean>(false);
  const { handleSubmit, setValue, formState } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: assignedPermissions ?? new AvailableSpacePermissions().empty,
    resolver: yupResolver(schema)
  });

  const currentSpaceId = space?.id;

  const { data, mutate: refreshPermissions } = useSWR(
    currentSpaceId ? `/proposals/list-permissions-${currentSpaceId}` : null,
    () => charmClient.permissions.spaces.listSpacePermissions(currentSpaceId as string)
  );

  const postCategoryPermissions = data?.forumCategories;
  const proposalCategoryPermissions = data?.proposalCategories;

  const defaultProposalCategoryPermissions = proposalCategoryPermissions?.filter((permission) => {
    return permission.assignee.group === 'space' && permission.assignee.id === currentSpaceId;
  });

  const defaultPostCategoryPermissions = postCategoryPermissions?.filter((permission) => {
    return permission.assignee.group === 'space' && permission.assignee.id === currentSpaceId;
  });

  const memberPermissionFlags = data?.standard.filter((permission) => permission.spaceId === currentSpaceId);

  usePreventReload(touched);

  // useEffect(() => {
  //   if (currentSpaceId) {
  //     refreshGroupPermissions(currentSpaceId);
  //   }
  // }, [currentSpaceId]);

  async function refreshGroupPermissions(resourceId: string) {
    await refreshPermissions();

    // spaceOperations.forEach((op) => {
    //   setValue(op, permissionFlags[op]);
    // });
    // setAssignedPermissions(permissionFlags);
  }

  async function submitted(formValues: FormValues) {
    // Make sure we have existing permission set to compare against
    if (assignedPermissions && currentSpaceId) {
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
        newPermissionState = await charmClient.permissions.spaces.addSpacePermissions({
          forSpaceId: currentSpaceId,
          operations: permissionsToAdd,
          spaceId: targetGroup === 'space' ? id : undefined,
          roleId: targetGroup === 'role' ? id : undefined
        });
      }

      if (permissionsToRemove.length > 0) {
        newPermissionState = await charmClient.permissions.spaces.removeSpacePermissions({
          forSpaceId: currentSpaceId,
          operations: permissionsToRemove,
          spaceId: targetGroup === 'space' ? id : undefined,
          roleId: targetGroup === 'role' ? id : undefined
        });
      }
      // Force a refresh of rendered components
      setAssignedPermissions(newPermissionState);
      callback();
      setTouched(false);
    }
  }

  async function deleteProposalCategoryPermission(permissionId: string) {
    await charmClient.permissions.proposals.deleteProposalCategoryPermission(permissionId);
    refreshPermissions();
  }

  async function updateProposalCategoryPermission(input: ProposalCategoryPermissionInput) {
    await charmClient.permissions.proposals.upsertProposalCategoryPermission(input);
    refreshPermissions();
  }

  async function deletePostCategoryPermission(permissionId: string) {
    await charmClient.permissions.forum.deletePostCategoryPermission(permissionId);
    refreshPermissions();
  }

  async function updatePostCategoryPermission(input: PostCategoryPermissionInput) {
    await charmClient.permissions.forum.upsertPostCategoryPermission(input);
    refreshPermissions();
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
            <Typography sx={{ my: 1 }}>Access to categories</Typography>
            <Box display='flex' gap={3} mb={2}>
              <Divider orientation='vertical' flexItem />
              <Box flexGrow={1}>
                {proposalCategories.map((category) => {
                  const permission = proposalCategoryPermissions?.find((p) => p.proposalCategoryId === category.id);
                  const memberRolePermission = defaultProposalCategoryPermissions?.find(
                    (p) => p.proposalCategoryId === category.id
                  );
                  return (
                    <ProposalCategoryRolePermissionRow
                      key={category.id}
                      canEdit={category.permissions.manage_permissions}
                      label={category.title}
                      deletePermission={deleteProposalCategoryPermission}
                      updatePermission={updateProposalCategoryPermission}
                      proposalCategoryId={category.id}
                      existingPermissionId={permission?.id}
                      defaultPermissionLevel={permission?.permissionLevel}
                      inheritedPermissionLevel={memberRolePermission?.permissionLevel}
                      assignee={{ group: targetGroup, id }}
                    />
                  );
                })}
              </Box>
            </Box>
            <Divider sx={{ mt: 1, mb: 2 }} />
            <Typography variant='body2' fontWeight='bold'>
              Forums
            </Typography>
            {targetGroup !== 'space' && (
              <PermissionToggle
                data-test='space-operation-moderateForums'
                label='Moderate and access all forum categories'
                defaultChecked={assignedPermissions?.moderateForums}
                memberChecked={memberPermissionFlags?.moderateForums}
                disabled={!isAdmin}
                onChange={(ev) => {
                  const { checked: nowHasAccess } = ev.target;
                  setValue('moderateForums', nowHasAccess);
                  setTouched(true);
                }}
              />
            )}
            <Typography sx={{ my: 1 }}>Access to categories</Typography>
            <Box display='flex' gap={3} mb={2}>
              <Divider orientation='vertical' flexItem />
              <Box flexGrow={1}>
                {forumCategories.map((category) => {
                  const permission = postCategoryPermissions?.find((p) => p.postCategoryId === category.id);
                  const memberRolePermission = defaultPostCategoryPermissions?.find(
                    (p) => p.postCategoryId === category.id
                  );
                  const canModerateForums =
                    memberPermissionFlags?.moderateForums || assignedPermissions?.moderateForums;
                  const permissionLevel = canModerateForums ? 'full_access' : permission?.permissionLevel;

                  return (
                    <PostCategoryRolePermissionRow
                      key={category.id}
                      canEdit={!canModerateForums && category.permissions.manage_permissions}
                      label={category.name}
                      deletePermission={deletePostCategoryPermission}
                      updatePermission={updatePostCategoryPermission}
                      postCategoryId={category.id}
                      existingPermissionId={permission?.id}
                      defaultPermissionLevel={permissionLevel}
                      inheritedPermissionLevel={memberRolePermission?.permissionLevel}
                      disabledTooltip={canModerateForums ? 'This role has full access to all categories' : undefined}
                      assignee={{ group: targetGroup, id }}
                    />
                  );
                })}
              </Box>
            </Box>

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
  const disabled = props.disabled;
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
          <Switch
            key={`${props.label}-${defaultChecked}`}
            data-test={props['data-test']}
            disabled={disabled}
            defaultChecked={defaultChecked}
            onChange={props.onChange}
          />
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
