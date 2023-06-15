import type {
  AssignablePagePermissionGroups,
  AssignedPagePermission,
  TargetPermissionGroup
} from '@charmverse/core/permissions';
import type { PageType, Role } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { Box, Button, Chip, Tooltip } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import Input from '@mui/material/OutlinedInput';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect } from 'react';

import charmClient from 'charmClient';
import { SmallSelect } from 'components/common/form/InputEnumToOptions';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import { Typography } from 'components/common/Typography';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePages } from 'hooks/usePages';
import { useRoles } from 'hooks/useRoles';
import type { Member } from 'lib/members/interfaces';
import { canReceiveManualPermissionUpdates } from 'lib/pages';
import type { ApplicablePagePermissionLevel } from 'lib/permissions/pages/labels';
import { pagePermissionLevels } from 'lib/permissions/pages/labels';

import AddPagePermissionsForm from './AddPagePermissionsForm';

const permissionDisplayOrder: AssignablePagePermissionGroups[] = ['space', 'role', 'user'];

const StyledInput = styled(Input)`
  padding-right: 0;
  position: relative;

  .MuiInputAdornment-root {
    display: block;
    height: 100%;
    max-height: none;
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 100px;
    text-align: right;

    button {
      height: 100%;
    }
  }
`;

/**
 * Orders permissions logically from space to role to user
 * @sideEffect Removes the permission from currrent space from the list so it can be handled in its own row
 * @param pagePermissions
 */
function sortPagePermissions({
  members,
  pagePermissions,
  roles
}: {
  pagePermissions: AssignedPagePermission[];
  members: Pick<Member, 'id' | 'isGuest' | 'username'>[];
  roles: Pick<Role, 'id' | 'name'>[];
}): (AssignedPagePermission & { displayName: string; isGuest?: boolean })[] {
  const sortedPermissions = pagePermissions
    .filter((permission) => {
      return permission.assignee.group === 'role' || permission.assignee.group === 'user';
    })
    .map((permission) => {
      const member =
        permission.assignee.group === 'user'
          ? members.find((m) => m.id === (permission.assignee as TargetPermissionGroup<'user'>).id)
          : null;
      const role =
        permission.assignee.group === 'role'
          ? roles.find((r) => r.id === (permission.assignee as TargetPermissionGroup<'role'>).id)
          : null;

      const userName = permission.assignee.group === 'user' ? member?.username : role?.name;

      return {
        ...permission,
        group: permission.assignee.group,
        displayName: userName ?? role?.name ?? 'Unknown',
        isGuest: member?.isGuest
      };
    })
    .sort((a, b) => {
      const aPermission = permissionDisplayOrder.indexOf(a.group);
      const bPermission = permissionDisplayOrder.indexOf(b.group);

      if (aPermission < bPermission) {
        return -1;
      } else if (aPermission > bPermission) {
        return 1;
      } else {
        return 0;
      }
    });

  return sortedPermissions;
}

interface Props {
  pageId: string;
  pageType: PageType;
  refreshPermissions: () => void;
  pagePermissions: AssignedPagePermission[];
  proposalId?: string;
}

export default function PagePermissions({ pageId, pagePermissions, refreshPermissions, pageType }: Props) {
  const { pages } = usePages();
  const { space } = useCurrentSpace();
  const { members, mutateMembers } = useMembers();
  const { roles } = useRoles();
  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-permission' });

  const spaceLevelPermission = pagePermissions.find(
    (permission) => space && permission.assignee.group === 'space' && permission.assignee.id === space?.id
  );
  const { permissions: userPagePermissions } = usePagePermissions({
    pageIdOrPath: pageId
  });

  useEffect(() => {
    refreshPermissions();
  }, [pageId]);

  async function updateSpacePagePermissionLevel(permissionLevel: ApplicablePagePermissionLevel | 'delete') {
    if (permissionLevel === 'delete') {
      if (spaceLevelPermission) {
        await charmClient.deletePermission({ permissionId: spaceLevelPermission.id });
      }
    } else if (space) {
      // The permission is being manually edited, so we drop the inheritance reference
      await charmClient.createPermission({
        pageId,
        permission: {
          permissionLevel,
          assignee: {
            group: 'space',
            id: space.id
          }
        }
      });
    }
    await refreshPermissions();
  }

  async function updatePagePermissionLevel(
    permission: AssignedPagePermission,
    permissionLevel: ApplicablePagePermissionLevel | 'delete'
  ) {
    if (permissionLevel === 'delete') {
      await charmClient.deletePermission({ permissionId: permission.id });
    } else if (permissionLevel !== permission.permissionLevel) {
      // The permission is being manually edited, so we drop the inheritance reference
      await charmClient.createPermission({
        pageId: permission.pageId,
        permission: {
          permissionLevel,
          assignee: permission.assignee
        }
      });
    }
    await refreshPermissions();
  }

  const sortedPermissions = sortPagePermissions({ pagePermissions, members, roles: roles ?? [] });

  // Remove proposal editor as it is not selectable
  // eslint-disable-next-line camelcase
  const { custom, proposal_editor, ...permissionsWithoutCustom } = pagePermissionLevels as Record<string, string>;
  const permissionsWithRemove = { ...permissionsWithoutCustom, delete: 'Remove' };

  const canEdit = userPagePermissions?.grant_permissions === true && canReceiveManualPermissionUpdates({ pageType });

  return (
    <Box p={1}>
      {canEdit && (
        <Box mb={1} onClick={() => popupState.open()}>
          <StyledInput
            placeholder='Add people, roles or emails'
            fullWidth
            readOnly
            endAdornment={
              <InputAdornment position='end'>
                <Button disableElevation>Invite</Button>
              </InputAdornment>
            }
          />
        </Box>
      )}

      <Box display='block' py={0.5}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2'>Default permissions</Typography>
          <div style={{ width: '160px', textAlign: 'right' }}>
            {canEdit ? (
              <SmallSelect
                renderValue={(value) => permissionsWithoutCustom[value as string] || 'No access'}
                onChange={(level) => updateSpacePagePermissionLevel(level as ApplicablePagePermissionLevel)}
                keyAndLabel={permissionsWithRemove as Record<string, string>}
                defaultValue={spaceLevelPermission?.permissionLevel ?? 'No access'}
              />
            ) : (
              <Tooltip
                title={
                  userPagePermissions?.edit_isPublic
                    ? 'You can only change this setting from the top proposal page.'
                    : ''
                }
              >
                <Typography color='secondary' variant='caption'>
                  {spaceLevelPermission ? permissionsWithoutCustom[spaceLevelPermission.permissionLevel] : 'No access'}
                </Typography>
              </Tooltip>
            )}
          </div>
        </Box>
        {spaceLevelPermission?.sourcePermission && (
          <Box display='block'>
            <Typography variant='caption'>
              Inherited from
              <Link
                sx={{ ml: 0.5 }}
                href={`/${space?.domain}/${pages[spaceLevelPermission?.sourcePermission.pageId]?.path}`}
              >
                {pages[spaceLevelPermission?.sourcePermission.pageId]?.title || 'Untitled'}
              </Link>
            </Typography>
          </Box>
        )}
      </Box>

      {sortedPermissions.map((permission) => {
        return (
          <Box display='block' py={0.5} key={permission.id}>
            <Box display='flex' justifyContent='space-between' alignItems='center' key={permission.displayName}>
              <Typography overflowEllipsis variant='body2'>
                {permission.displayName}
              </Typography>
              {permission.isGuest && <Chip size='small' color='warning' variant='outlined' label='Guest' />}
              <div style={{ width: '160px', textAlign: 'right' }}>
                {canEdit ? (
                  <SmallSelect
                    renderValue={(value) => permissionsWithoutCustom[value as string]}
                    onChange={(level) => updatePagePermissionLevel(permission, level as ApplicablePagePermissionLevel)}
                    keyAndLabel={permissionsWithRemove as Record<string, string>}
                    defaultValue={permission.permissionLevel}
                  />
                ) : (
                  <Typography color='secondary' variant='caption'>
                    {pagePermissionLevels[permission.permissionLevel as ApplicablePagePermissionLevel]}
                  </Typography>
                )}
              </div>
            </Box>
            {permission.sourcePermission && (
              <Box display='block'>
                <Typography variant='caption'>
                  Inherited from
                  <Link sx={{ ml: 0.5 }} href={`/${space?.domain}/${pages[permission.sourcePermission.pageId]?.path}`}>
                    {pages[permission.sourcePermission.pageId]?.title || 'Untitled'}
                  </Link>
                </Typography>
              </Box>
            )}
          </Box>
        );
      })}

      <Modal {...bindPopover(popupState)} title='Invite people to this page' size='420px'>
        <AddPagePermissionsForm
          existingPermissions={pagePermissions}
          pageId={pageId}
          permissionsAdded={() => {
            refreshPermissions();
            mutateMembers();
            popupState.close();
          }}
        />
      </Modal>
    </Box>
  );
}
