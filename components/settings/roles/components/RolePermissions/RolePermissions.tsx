import { Box, Divider, FormControlLabel, Grid, Switch, Tooltip, Typography } from '@mui/material';
import type { SpaceOperation } from '@prisma/client';
import type { ChangeEvent } from 'react';
import { useReducer, useEffect, useState } from 'react';
import { mutate } from 'swr';
import useSWR from 'swr/immutable';
import { v4 as uuid } from 'uuid';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { PostCategoryRolePermissionRow } from 'components/forum/components/permissions/PostCategoryPermissionRow';
import { ProposalCategoryRolePermissionRow } from 'components/proposals/components/permissions/ProposalCategoryPermissionRow';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PostCategoryPermissionInput } from 'lib/permissions/forum/upsertPostCategoryPermission';
import type { AssignablePermissionGroups } from 'lib/permissions/interfaces';
import type { ProposalCategoryPermissionInput } from 'lib/permissions/proposals/upsertProposalCategoryPermission';
import { AvailableSpacePermissions } from 'lib/permissions/spaces/client';
import type { SpacePermissions } from 'lib/permissions/spaces/listPermissions';

/**
 * @param callback Used to tell the parent the operation is complete. Useful for triggering refreshes
 */
interface Props {
  targetGroup: Extract<AssignablePermissionGroups, 'space' | 'role'>;
  id: string;
  callback?: () => void;
}

type FormAction =
  | {
      type: 'reset_permissions';
      state?: SpacePermissions;
    }
  | {
      type: 'set_space_permission';
      permission: SpaceOperation;
      permissionValue: boolean;
    }
  | {
      type: 'delete_proposal_category_permission';
      id: string;
    }
  | {
      type: 'set_proposal_category_permission';
      permission: Omit<SpacePermissions['proposalCategories'][number], 'id'> & { id?: string };
    }
  | {
      type: 'delete_forum_category_permission';
      id: string;
    }
  | {
      type: 'set_forum_category_permission';
      permission: Omit<SpacePermissions['forumCategories'][number], 'id'> & { id?: string };
    };

function reducerWithContext({ id }: { id: string }) {
  return function reducer(state: SpacePermissions, action: FormAction): SpacePermissions {
    switch (action.type) {
      // remove permissions, role will inherit from Member role instead
      case 'reset_permissions': {
        if (action.state) {
          return JSON.parse(JSON.stringify(action.state));
        }
        return {
          space: state.space.filter((perm) => perm.assignee.id !== id),
          forumCategories: state.forumCategories.filter((perm) => (perm.assignee as { id: string }).id !== id),
          proposalCategories: state.proposalCategories.filter((perm) => (perm.assignee as { id: string }).id !== id)
        };
      }
      case 'set_space_permission': {
        const permission = state.space.find((perm) => perm.assignee.id === id);
        if (permission) {
          permission.operations[action.permission] = action.permissionValue;
        } else {
          const defaults = state.space.find((perm) => perm.assignee.group === 'space');
          if (defaults) {
            state.space.push({
              assignee: { id, group: 'role' },
              operations: {
                ...defaults.operations,
                [action.permission]: action.permissionValue
              }
            });
          }
        }
        return {
          ...state
        };
      }
      case 'delete_forum_category_permission': {
        return {
          ...state,
          forumCategories: state.forumCategories.filter((perm) => perm.id !== action.id)
        };
      }
      case 'set_forum_category_permission': {
        const perm = action.permission;
        const category = perm.id && state.forumCategories.find((p) => p.id === perm.id);
        if (category) {
          Object.assign(category, perm);
        } else {
          state.forumCategories.push({ ...perm, id: uuid() });
        }

        return {
          ...state,
          forumCategories: [...state.forumCategories]
        };
      }
      case 'delete_proposal_category_permission': {
        return {
          ...state,
          proposalCategories: state.proposalCategories.filter((perm) => perm.id !== action.id)
        };
      }
      case 'set_proposal_category_permission': {
        const perm = action.permission;
        const category = perm.id && state.proposalCategories.find((p) => p.id === perm.id);
        if (category) {
          Object.assign(category, perm);
        } else {
          state.proposalCategories.push({ ...perm, id: uuid() });
        }
        return {
          ...state,
          proposalCategories: [...state.proposalCategories]
        };
      }
      default:
        throw Error(`Unknown action`);
    }
  };
}

export function RolePermissions({ targetGroup, id, callback = () => null }: Props) {
  const space = useCurrentSpace();
  const { categories: proposalCategories = [] } = useProposalCategories();
  const { categories: forumCategories = [] } = useForumCategories();
  const isAdmin = useIsAdmin();
  const { showMessage } = useSnackbar();
  // const [assignedPermissions, setAssignedPermissions] = useState<SpacePermissionFlags | null>(null);
  // custom onChange is used for switches so isDirty from useForm doesn't change its value
  const [touched, setTouched] = useState<boolean>(false);
  const [formState, dispatch] = useReducer(reducerWithContext({ id }), {
    space: [],
    forumCategories: [],
    proposalCategories: []
  });

  const currentSpaceId = space?.id;

  const { data: originalPermissions } = useSWR(
    currentSpaceId ? `/proposals/list-permissions-${currentSpaceId}` : null,
    () => charmClient.permissions.spaces.listSpacePermissions(currentSpaceId as string)
  );

  const defaultProposalCategoryPermissions = formState.proposalCategories.filter((permission) => {
    return permission.assignee.group === 'space' && permission.assignee.id === currentSpaceId;
  });

  const defaultForumCategoryPermissions = formState.forumCategories?.filter((permission) => {
    return permission.assignee.group === 'space' && permission.assignee.id === currentSpaceId;
  });

  const assignedPermissions = formState.space.find((permission) => permission.assignee.id === id)?.operations;
  const defaultPermissions = formState.space.find((permission) => permission.assignee.group === 'space')?.operations;

  useEffect(() => {
    if (originalPermissions) {
      dispatch({ type: 'reset_permissions', state: originalPermissions });
    }
  }, [originalPermissions]);

  usePreventReload(touched);

  async function handleSubmit() {
    const rolePermissions = assignedPermissions || new AvailableSpacePermissions().empty;
    if (rolePermissions && currentSpaceId) {
      const updatedPermissions = { ...formState };
      if (targetGroup === 'role') {
        // @ts-ignore - add meta to track update
        updatedPermissions.roleIdToTrack = id;
      }
      await charmClient.permissions.spaces.saveSpacePermissions(currentSpaceId, updatedPermissions);
      callback();
      setTouched(false);
      // refresh all caches of permissions in case multiple rows are being updated
      mutate(`/proposals/list-permissions-${currentSpaceId}`);
      showMessage('Permissions updated');
    }
  }

  async function deleteProposalCategoryPermission(permissionId: string) {
    dispatch({ type: 'delete_proposal_category_permission', id: permissionId });
    setTouched(true);
  }

  async function updateProposalCategoryPermission(permission: ProposalCategoryPermissionInput) {
    dispatch({ type: 'set_proposal_category_permission', permission });
    setTouched(true);
  }

  async function deletePostCategoryPermission(permissionId: string) {
    dispatch({ type: 'delete_forum_category_permission', id: permissionId });
    setTouched(true);
  }

  async function updatePostCategoryPermission(permission: PostCategoryPermissionInput) {
    dispatch({ type: 'set_forum_category_permission', permission });
    setTouched(true);
  }

  function setSpacePermission(permission: SpaceOperation, permissionValue: boolean) {
    dispatch({
      type: 'set_space_permission',
      permission,
      permissionValue
    });
    setTouched(true);
  }

  return (
    <div data-test={`space-permissions-form-${targetGroup}`}>
      <form style={{ margin: 'auto' }}>
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
              memberChecked={targetGroup !== 'space' ? defaultPermissions?.createPage : false}
              onChange={(ev) => {
                const { checked: nowHasAccess } = ev.target;
                setSpacePermission('createPage', nowHasAccess);
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
              memberChecked={targetGroup !== 'space' ? defaultPermissions?.createBounty : false}
              onChange={(ev) => {
                const { checked: nowHasAccess } = ev.target;
                setSpacePermission('createBounty', nowHasAccess);
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
              memberChecked={targetGroup !== 'space' ? defaultPermissions?.reviewProposals : false}
              disabled={!isAdmin}
              onChange={(ev) => {
                const { checked: nowHasAccess } = ev.target;
                setSpacePermission('reviewProposals', nowHasAccess);
              }}
            />
            <Typography sx={{ my: 1 }}>Access to categories</Typography>
            <Box display='flex' gap={3} mb={2}>
              <Divider orientation='vertical' flexItem />
              <Box flexGrow={1}>
                {proposalCategories.map((category) => {
                  const permission = formState.proposalCategories.find(
                    (p) => p.proposalCategoryId === category.id && (p.assignee as { id: string }).id === id
                  );
                  const memberRolePermission =
                    targetGroup !== 'space' &&
                    defaultProposalCategoryPermissions?.find((p) => p.proposalCategoryId === category.id);
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
                memberChecked={defaultPermissions?.moderateForums}
                disabled={!isAdmin}
                onChange={(ev) => {
                  const { checked: nowHasAccess } = ev.target;
                  setSpacePermission('moderateForums', nowHasAccess);
                }}
              />
            )}
            <Typography sx={{ my: 1 }}>Access to categories</Typography>
            <Box display='flex' gap={3} mb={2}>
              <Divider orientation='vertical' flexItem />
              <Box flexGrow={1}>
                {forumCategories.map((category) => {
                  const permission = formState.forumCategories?.find(
                    (p) => p.postCategoryId === category.id && (p.assignee as { id: string }).id === id
                  );
                  const memberRolePermission =
                    targetGroup !== 'space' &&
                    defaultForumCategoryPermissions?.find((p) => p.postCategoryId === category.id);
                  const canModerateForums = defaultPermissions?.moderateForums || assignedPermissions?.moderateForums;
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
                  onClick={handleSubmit}
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
  // const disabled = props.disabled;
  // const defaultChecked = props.memberChecked || props.defaultChecked;
  const useDefault = typeof props.defaultChecked !== 'boolean';
  return (
    <FormControlLabel
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        margin: 0
      }}
      control={
        typeof props.defaultChecked === 'boolean' || typeof props.memberChecked === 'boolean' ? (
          <Tooltip title={useDefault ? 'Default setting' : ''}>
            <span
              style={{
                opacity: useDefault ? 0.5 : 1
              }}
            >
              <Switch
                // key={`${props.label}-${defaultChecked}`}
                data-test={props['data-test']}
                disabled={props.disabled}
                checked={useDefault ? props.memberChecked : props.defaultChecked}
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
