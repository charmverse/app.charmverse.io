import type { PostCategoryPermissionAssignment } from '@charmverse/core/permissions';
import type { SpaceOperation } from '@charmverse/core/prisma';
import { Box, Divider, Grid, Typography } from '@mui/material';
import type { AssignablePermissionGroups } from '@packages/lib/permissions/interfaces';
import type { SpacePermissions } from '@packages/lib/permissions/spaces/listPermissions';
import { useEffect, useReducer, useState } from 'react';
import useSWR from 'swr/immutable';
import { v4 as uuid } from 'uuid';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { PostCategoryRolePermissionRow } from 'components/forum/components/PostCategoryPermissions/components/PostCategoryPermissionRow';
import { UpgradeChip } from 'components/settings/subscription/UpgradeWrapper';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import { PermissionToggle } from './components/PermissionToggle';

/**
 * @param callback Used to tell the parent the operation is complete. Useful for triggering refreshes
 */
interface Props {
  disabled?: boolean;
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
          forumCategories: state.forumCategories.filter((perm) => (perm.assignee as { id: string }).id !== id)
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
      default:
        throw Error(`Unknown action`);
    }
  };
}

export function RolePermissions({ disabled, targetGroup, id, callback = () => null }: Props) {
  const { space } = useCurrentSpace();
  const { isFreeSpace } = useIsFreeSpace();
  const { categories: forumCategories = [], isLoading: forumCategoriesLoading } = useForumCategories();
  const isAdmin = useIsAdmin();
  const { showMessage } = useSnackbar();
  // const [rolePermissions, setAssignedPermissions] = useState<SpacePermissionFlags | null>(null);
  // custom onChange is used for switches so isDirty from useForm doesn't change its value
  const [touched, setTouched] = useState<boolean>(false);
  const { getFeatureTitle } = useSpaceFeatures();
  const [formState, dispatch] = useReducer(reducerWithContext({ id }), {
    space: [],
    forumCategories: []
  });

  const currentSpaceId = space?.id;

  const categoryIds = forumCategories.map((c) => c.id);

  const { data: originalPermissions, mutate: refreshPermissions } = useSWR(
    currentSpaceId && !forumCategoriesLoading ? `/proposals/list-permissions-${currentSpaceId}-${categoryIds}` : null,
    () => charmClient.permissions.spaces.listSpacePermissions(currentSpaceId as string)
  );

  const defaultForumCategoryPermissions = formState.forumCategories?.filter((permission) => {
    return permission.assignee.group === 'space' && permission.assignee.id === currentSpaceId;
  });

  const rolePermissions = formState.space.find((permission) => permission.assignee.id === id)?.operations;
  const spacePermissions = formState.space.find((permission) => permission.assignee.group === 'space')?.operations;

  useEffect(() => {
    if (originalPermissions) {
      dispatch({ type: 'reset_permissions', state: originalPermissions });
    }
  }, [originalPermissions]);

  usePreventReload(touched);

  async function handleSubmit() {
    if (currentSpaceId) {
      const updatedPermissions = { ...formState };
      if (targetGroup === 'role') {
        // @ts-ignore - add meta to track update
        updatedPermissions.roleIdToTrack = id;
      }
      try {
        await charmClient.permissions.spaces.saveSpacePermissions(currentSpaceId, updatedPermissions);
        callback();
        setTouched(false);
        // refresh all caches of permissions in case multiple rows are being updated
        refreshPermissions();
        showMessage('Permissions updated');
      } catch (error) {
        showMessage('There was an error saving permissions', 'error');
      }
    }
  }

  async function deletePostCategoryPermission(permissionId: string) {
    dispatch({ type: 'delete_forum_category_permission', id: permissionId });
    setTouched(true);
  }

  async function updatePostCategoryPermission(permission: PostCategoryPermissionAssignment) {
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

  const disableModifications = !isAdmin || isFreeSpace;

  return (
    <div data-test={`space-permissions-form-${targetGroup}`}>
      <form style={{ margin: 'auto' }}>
        <Grid container gap={2}>
          <Grid size={{ xs: 12, md: 12 }}>
            <Typography variant='body2' fontWeight='bold' gap={1} display='flex' alignItems='center'>
              Pages
              <UpgradeChip upgradeContext='forum_permissions' />
            </Typography>
            <PermissionToggle
              data-test='space-operation-createPage'
              label='Create new pages'
              defaultChecked={isFreeSpace ? true : rolePermissions?.createPage}
              disabled={disableModifications || !!disabled}
              memberChecked={targetGroup !== 'space' ? spacePermissions?.createPage : undefined}
              onChange={(ev) => {
                const { checked: nowHasAccess } = ev.target;
                setSpacePermission('createPage', nowHasAccess);
              }}
              upgradeContext='page_permissions'
            />
            {targetGroup !== 'space' && (
              <PermissionToggle
                data-test='space-operation-deleteAnyPage'
                label='Delete any page'
                defaultChecked={!isFreeSpace && !!rolePermissions?.deleteAnyPage}
                disabled={disableModifications || !!disabled}
                onChange={(ev) => {
                  const { checked: nowHasAccess } = ev.target;
                  setSpacePermission('deleteAnyPage', nowHasAccess);
                }}
                upgradeContext='page_permissions'
              />
            )}
            <Divider sx={{ mt: 1, mb: 2 }} />
            <Typography variant='body2' fontWeight='bold' gap={1} display='flex' alignItems='center'>
              {getFeatureTitle('Rewards')}
              <UpgradeChip upgradeContext='forum_permissions' />
            </Typography>
            <PermissionToggle
              data-test='space-operation-createBounty'
              label={`Create new ${getFeatureTitle('rewards')}`}
              defaultChecked={isFreeSpace ? true : rolePermissions?.createBounty}
              disabled={disableModifications || !!disabled}
              memberChecked={targetGroup !== 'space' ? spacePermissions?.createBounty : undefined}
              onChange={(ev) => {
                const { checked: nowHasAccess } = ev.target;
                setSpacePermission('createBounty', nowHasAccess);
              }}
              upgradeContext='bounty_permissions'
            />
            {targetGroup !== 'space' && (
              <PermissionToggle
                data-test='space-operation-deleteAnyBounty'
                label='Delete any reward'
                defaultChecked={!isFreeSpace && !!rolePermissions?.deleteAnyBounty}
                disabled={disableModifications || !!disabled}
                onChange={(ev) => {
                  const { checked: nowHasAccess } = ev.target;
                  setSpacePermission('deleteAnyBounty', nowHasAccess);
                }}
                upgradeContext='bounty_permissions'
              />
            )}
            <Divider sx={{ mt: 1, mb: 2 }} />
            <Typography variant='body2' fontWeight='bold' gap={1} display='flex' alignItems='center'>
              Proposals
              <UpgradeChip upgradeContext='forum_permissions' />
            </Typography>
            <PermissionToggle
              label='Create proposals'
              defaultChecked={isFreeSpace ? true : rolePermissions?.createProposals}
              memberChecked={targetGroup !== 'space' ? spacePermissions?.createProposals : undefined}
              disabled={disableModifications || !!disabled}
              onChange={(ev) => {
                setSpacePermission('createProposals', ev.target.checked);
              }}
              upgradeContext='proposal_permissions'
            />
            {targetGroup !== 'space' && (
              <PermissionToggle
                data-test='space-operation-deleteAnyProposal'
                label='Delete and archive any proposal'
                defaultChecked={!!rolePermissions?.deleteAnyProposal && !isFreeSpace}
                disabled={disableModifications || !!disabled}
                onChange={(ev) => {
                  const { checked: nowHasAccess } = ev.target;
                  setSpacePermission('deleteAnyProposal', nowHasAccess);
                }}
                upgradeContext='proposal_permissions'
              />
            )}
            <Divider sx={{ mt: 1, mb: 2 }} />
            <Typography variant='body2' fontWeight='bold' gap={1} display='flex' alignItems='center'>
              Forums
              <UpgradeChip upgradeContext='forum_permissions' />
            </Typography>
            {targetGroup !== 'space' && (
              <PermissionToggle
                data-test='space-operation-moderateForums'
                label='Moderate and access all forum categories'
                defaultChecked={rolePermissions?.moderateForums && !isFreeSpace}
                memberChecked={spacePermissions?.moderateForums}
                disabled={disableModifications || !!disabled}
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
                    targetGroup !== 'space'
                      ? defaultForumCategoryPermissions?.find((p) => p.postCategoryId === category.id)
                      : undefined;
                  const canModerateForums = spacePermissions?.moderateForums || rolePermissions?.moderateForums;
                  const permissionLevel = canModerateForums ? 'full_access' : permission?.permissionLevel;

                  return (
                    <PostCategoryRolePermissionRow
                      key={category.id}
                      canEdit={category.permissions.manage_permissions && !isFreeSpace && !disabled}
                      label={category.name}
                      deletePermission={deletePostCategoryPermission}
                      updatePermission={updatePostCategoryPermission}
                      postCategoryId={category.id}
                      existingPermissionId={permission?.id}
                      permissionLevel={isFreeSpace ? 'full_access' : permissionLevel}
                      defaultPermissionLevel={!isFreeSpace ? memberRolePermission?.permissionLevel : undefined}
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
                  disabled={!touched || !!disabled}
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
