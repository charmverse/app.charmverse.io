import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Divider, FormControlLabel, Grid, Paper, Switch, Tooltip, Typography } from '@mui/material';
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
import { useCurrentSpaceId } from 'hooks/useCurrentSpaceId';
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
  const { currentSpaceId } = useCurrentSpaceId();
  const { categories: proposalCategories = [] } = useProposalCategories();
  const { categories: forumCategories = [] } = useForumCategories();
  const isAdmin = useIsAdmin();
  const [assignedPermissions, setAssignedPermissions] = useState<SpacePermissionFlags | null>(null);
  // custom onChange is used for switches so isDirty from useForm doesn't change it value
  const [touched, setTouched] = useState<boolean>(false);
  const { handleSubmit, setValue } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: assignedPermissions ?? new AvailableSpacePermissions().empty,
    resolver: yupResolver(schema)
  });

  const { data: proposalCategoryPermissions, mutate: mutateProposalCategoryPermissions } = useSWR(
    `/proposals/list-group-proposal-category-permissions-${id}`,
    () => charmClient.permissions.proposals.listGroupProposalCategoryPermissions({ group: targetGroup, id })
  );
  const { data: postCategoryPermissions, mutate: mutatePostCategoryPermissions } = useSWR(
    `/posts/list-group-post-category-permissions-${id}`,
    () => charmClient.permissions.forum.listGroupPostCategoryPermissions({ group: targetGroup, id })
  );
  // retriee space-level permissions to display as default
  const { data: spaceProposalCategoryPermissions } = useSWR(
    currentSpaceId &&
      targetGroup !== 'space' &&
      `/proposals/list-group-proposal-category-permissions-${currentSpaceId}`,
    () => charmClient.permissions.proposals.listGroupProposalCategoryPermissions({ group: 'space', id: currentSpaceId })
  );
  const { data: spacePostCategoryPermissions } = useSWR(
    currentSpaceId && targetGroup !== 'space' && `/posts/list-group-post-category-permissions-${currentSpaceId}`,
    () => charmClient.permissions.forum.listGroupPostCategoryPermissions({ group: 'space', id: currentSpaceId })
  );

  const { data: memberPermissionFlags } = useSWR(
    targetGroup !== 'space' && currentSpaceId ? `member-permissions-${currentSpaceId}` : null,
    () =>
      charmClient.queryGroupSpacePermissions({
        group: 'space',
        id: currentSpaceId,
        resourceId: currentSpaceId
      })
  );

  usePreventReload(touched);

  useEffect(() => {
    if (currentSpaceId) {
      refreshGroupPermissions(currentSpaceId);
    }
  }, [currentSpaceId]);

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
        newPermissionState = await charmClient.addSpacePermissions({
          forSpaceId: currentSpaceId,
          operations: permissionsToAdd,
          spaceId: targetGroup === 'space' ? id : undefined,
          roleId: targetGroup === 'role' ? id : undefined
        });
      }

      if (permissionsToRemove.length > 0) {
        newPermissionState = await charmClient.removeSpacePermissions({
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
      // update the cache of other rows
      if (targetGroup === 'space') {
        mutate(`member-permissions-${currentSpaceId}`);
      }
    }
  }

  async function deleteProposalCategoryPermission(permissionId: string) {
    await charmClient.permissions.proposals.deleteProposalCategoryPermission(permissionId);
    mutateProposalCategoryPermissions();
  }

  async function updateProposalCategoryPermission(input: ProposalCategoryPermissionInput) {
    await charmClient.permissions.proposals.upsertProposalCategoryPermission(input);
    mutateProposalCategoryPermissions();
  }

  async function deletePostCategoryPermission(permissionId: string) {
    await charmClient.permissions.forum.deletePostCategoryPermission(permissionId);
    mutatePostCategoryPermissions();
  }

  async function updatePostCategoryPermission(input: PostCategoryPermissionInput) {
    await charmClient.permissions.forum.upsertPostCategoryPermission(input);
    mutatePostCategoryPermissions();
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
                  const memberRolePermission = spaceProposalCategoryPermissions?.find(
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
                      emptyValue={memberRolePermission?.permissionLevel}
                      isInherited={memberRolePermission && !permission}
                      assignee={{ group: targetGroup, id }}
                    />
                  );
                })}
              </Box>
            </Box>
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
                <Typography sx={{ my: 1 }}>Access to categories</Typography>
                <Box display='flex' gap={3} mb={2}>
                  <Divider orientation='vertical' flexItem />
                  <Box flexGrow={1}>
                    {forumCategories.map((category) => {
                      const permission = postCategoryPermissions?.find((p) => p.postCategoryId === category.id);
                      const memberRolePermission = spacePostCategoryPermissions?.find(
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
                          emptyValue={memberRolePermission?.permissionLevel}
                          isInherited={!canModerateForums && memberRolePermission && !permission}
                          disabledTooltip={
                            canModerateForums ? 'This role has full access to all categories' : undefined
                          }
                          assignee={{ group: targetGroup, id }}
                        />
                      );
                    })}
                  </Box>
                </Box>
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
