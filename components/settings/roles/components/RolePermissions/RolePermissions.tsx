import type { PostCategoryPermissionAssignment, TargetPermissionGroup } from '@charmverse/core/permissions';
import { AvailableSpacePermissions } from '@charmverse/core/permissions/flags';
import type { SpaceOperation } from '@charmverse/core/prisma';
import { Box, Divider, Grid, Typography } from '@mui/material';
import { useEffect, useReducer, useState } from 'react';
import { mutate } from 'swr';
import useSWR from 'swr/immutable';
import { v4 as uuid } from 'uuid';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { PostCategoryRolePermissionRow } from 'components/forum/components/PostCategoryPermissions/components/PostCategoryPermissionRow';
import { ProposalCategoryRolePermissionRow } from 'components/proposals/components/ProposalViewOptions/components/ProposalCategoryPermissionsDialog/components/ProposalCategoryPermissionRow';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import { UpgradeChip } from 'components/settings/subscription/UpgradeWrapper';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSnackbar } from 'hooks/useSnackbar';
import type { AssignablePermissionGroups } from 'lib/permissions/interfaces';
import type { ProposalCategoryPermissionInput } from 'lib/permissions/proposals/upsertProposalCategoryPermission';
import type { SpacePermissions } from 'lib/permissions/spaces/listPermissions';

import { PermissionToggle } from './components/PermissionToggle';

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
  const { space } = useCurrentSpace();
  const { isFreeSpace } = useIsFreeSpace();
  const { categories: proposalCategories = [], isLoading: proposalCategoriesLoading } = useProposalCategories();
  const { categories: forumCategories = [], isLoading: forumCategoriesLoading } = useForumCategories();
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

  const categoryIds = [...proposalCategories.map((c) => c.id), ...forumCategories.map((c) => c.id)];

  const { data: originalPermissions, mutate: refreshPermissions } = useSWR(
    currentSpaceId && !forumCategoriesLoading && !proposalCategoriesLoading
      ? `/proposals/list-permissions-${currentSpaceId}-${categoryIds}`
      : null,
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
          <Grid item xs={12} md={12}>
            <Typography variant='body2' fontWeight='bold' gap={1} display='flex' alignItems='center'>
              Pages
              <UpgradeChip upgradeContext='forum_permissions' />
            </Typography>
            <PermissionToggle
              data-test='space-operation-createPage'
              label='Create new pages'
              defaultChecked={isFreeSpace ? true : assignedPermissions?.createPage}
              disabled={disableModifications}
              memberChecked={targetGroup !== 'space' ? defaultPermissions?.createPage : undefined}
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
                defaultChecked={!isFreeSpace && !!assignedPermissions?.deleteAnyPage}
                disabled={disableModifications}
                onChange={(ev) => {
                  const { checked: nowHasAccess } = ev.target;
                  setSpacePermission('deleteAnyPage', nowHasAccess);
                }}
                upgradeContext='page_permissions'
              />
            )}
            <Divider sx={{ mt: 1, mb: 2 }} />
            <Typography variant='body2' fontWeight='bold' gap={1} display='flex' alignItems='center'>
              Rewards
              <UpgradeChip upgradeContext='forum_permissions' />
            </Typography>
            <PermissionToggle
              data-test='space-operation-createBounty'
              label='Create new rewards'
              defaultChecked={isFreeSpace ? true : assignedPermissions?.createBounty}
              disabled={disableModifications}
              memberChecked={targetGroup !== 'space' ? defaultPermissions?.createBounty : undefined}
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
                defaultChecked={!isFreeSpace && !!assignedPermissions?.deleteAnyBounty}
                disabled={disableModifications}
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
              data-test='space-operation-reviewProposals'
              label='Review proposals'
              defaultChecked={isFreeSpace ? true : assignedPermissions?.reviewProposals}
              memberChecked={targetGroup !== 'space' ? defaultPermissions?.reviewProposals : undefined}
              disabled={disableModifications}
              onChange={(ev) => {
                const { checked: nowHasAccess } = ev.target;
                setSpacePermission('reviewProposals', nowHasAccess);
              }}
              upgradeContext='proposal_permissions'
            />
            {targetGroup !== 'space' && (
              <PermissionToggle
                data-test='space-operation-deleteAnyProposal'
                label='Delete and archive any proposal'
                defaultChecked={!!assignedPermissions?.deleteAnyProposal && !isFreeSpace}
                disabled={disableModifications}
                onChange={(ev) => {
                  const { checked: nowHasAccess } = ev.target;
                  setSpacePermission('deleteAnyProposal', nowHasAccess);
                }}
                upgradeContext='proposal_permissions'
              />
            )}
            <Typography sx={{ my: 1 }}>Access to categories</Typography>
            <Box display='flex' gap={3} mb={2}>
              <Divider orientation='vertical' flexItem />
              <Box flexGrow={1}>
                {proposalCategories.map((category) => {
                  const permission = formState.proposalCategories.find(
                    (p) =>
                      p.proposalCategoryId === category.id &&
                      (p.assignee as TargetPermissionGroup<'space' | 'role'>).id === id
                  );

                  const defaultSpaceProposalPermission =
                    targetGroup === 'space'
                      ? undefined
                      : defaultProposalCategoryPermissions.find((p) => p.proposalCategoryId === category.id);
                  return (
                    <ProposalCategoryRolePermissionRow
                      key={category.id}
                      canEdit={category.permissions.manage_permissions && !isFreeSpace}
                      label={category.title}
                      deletePermission={deleteProposalCategoryPermission}
                      updatePermission={updateProposalCategoryPermission}
                      proposalCategoryId={category.id}
                      existingPermissionId={permission?.id}
                      permissionLevel={isFreeSpace ? 'full_access' : permission?.permissionLevel}
                      defaultPermissionLevel={
                        isFreeSpace
                          ? undefined
                          : targetGroup === 'space'
                          ? undefined
                          : defaultSpaceProposalPermission?.permissionLevel
                      }
                      assignee={{ group: targetGroup, id }}
                    />
                  );
                })}
              </Box>
            </Box>
            <Divider sx={{ mt: 1, mb: 2 }} />
            <Typography variant='body2' fontWeight='bold' gap={1} display='flex' alignItems='center'>
              Forums
              <UpgradeChip upgradeContext='forum_permissions' />
            </Typography>
            {targetGroup !== 'space' && (
              <PermissionToggle
                data-test='space-operation-moderateForums'
                label='Moderate and access all forum categories'
                defaultChecked={assignedPermissions?.moderateForums && !isFreeSpace}
                memberChecked={defaultPermissions?.moderateForums}
                disabled={disableModifications}
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
                  const canModerateForums = defaultPermissions?.moderateForums || assignedPermissions?.moderateForums;
                  const permissionLevel = canModerateForums ? 'full_access' : permission?.permissionLevel;

                  return (
                    <PostCategoryRolePermissionRow
                      key={category.id}
                      canEdit={category.permissions.manage_permissions && !isFreeSpace}
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
