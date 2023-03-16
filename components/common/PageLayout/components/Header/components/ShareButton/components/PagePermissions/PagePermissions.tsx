import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Input from '@mui/material/OutlinedInput';
import Tooltip from '@mui/material/Tooltip';
import type { PageType } from '@prisma/client';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect } from 'react';

import charmClient from 'charmClient';
import { SmallSelect } from 'components/common/form/InputEnumToOptions';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import { Typography } from 'components/common/Typography';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { canReceiveManualPermissionUpdates } from 'lib/pages';
import type {
  IPagePermissionWithAssignee,
  PagePermissionLevelType
} from 'lib/permissions/pages/page-permission-interfaces';
import { permissionLevels } from 'lib/permissions/pages/page-permission-mapping';

import AddPagePermissionsForm from './AddPagePermissionsForm';

const permissionDisplayOrder = ['space', 'role', 'user'];

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
function sortPagePermissions(
  pagePermissions: IPagePermissionWithAssignee[]
): (IPagePermissionWithAssignee & { displayName: string })[] {
  const sortedPermissions = pagePermissions
    .filter((permission) => {
      return !permission.spaceId && !permission.public;
    })
    .map((permission) => {
      const permissionSource = permission.user ? 'user' : 'role';

      const permissionDisplayName = permissionSource === 'user' ? permission.user!.username : permission.role!.name;

      return {
        ...permission,
        permissionSource,
        displayName: permissionDisplayName as string
      };
    })
    .sort((a, b) => {
      const aPermission = permissionDisplayOrder.indexOf(a.permissionSource);
      const bPermission = permissionDisplayOrder.indexOf(b.permissionSource);

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
  pagePermissions: IPagePermissionWithAssignee[];
  proposalId?: string;
}

export default function PagePermissions({ pageId, pagePermissions, refreshPermissions, pageType }: Props) {
  const { pages, getPagePermissions } = usePages();
  const space = useCurrentSpace();
  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-permission' });

  const spaceLevelPermission = pagePermissions.find((permission) => space && permission.spaceId === space?.id);
  const userPagePermissions = getPagePermissions(pageId);

  useEffect(() => {
    refreshPermissions();
  }, [pageId]);

  async function updateSpacePagePermissionLevel(permissionLevel: PagePermissionLevelType | 'delete') {
    if (permissionLevel === 'delete') {
      if (spaceLevelPermission) {
        await charmClient.deletePermission(spaceLevelPermission.id);
      }
    } else if (space) {
      // The permission is being manually edited, so we drop the inheritance reference
      await charmClient.createPermission({
        pageId,
        permissionLevel,
        spaceId: space.id
      });
    }
    await refreshPermissions();
  }

  async function updatePagePermissionLevel(
    permission: IPagePermissionWithAssignee,
    permissionLevel: PagePermissionLevelType | 'delete'
  ) {
    if (permissionLevel === 'delete') {
      await charmClient.deletePermission(permission.id);
    } else if (permissionLevel !== permission.permissionLevel) {
      // The permission is being manually edited, so we drop the inheritance reference
      await charmClient.createPermission({
        pageId: permission.pageId,
        permissionLevel,
        roleId: permission.roleId,
        userId: permission.userId
      });
    }
    await refreshPermissions();
  }

  const sortedPermissions = sortPagePermissions(pagePermissions);

  // Remove proposal editor as it is not selectable
  // eslint-disable-next-line camelcase
  const { custom, proposal_editor, ...permissionsWithoutCustom } = permissionLevels as Record<string, string>;
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
          <Typography variant='body2'>Everyone at {space?.name}</Typography>
          <div style={{ width: '160px', textAlign: 'right' }}>
            {canEdit ? (
              <SmallSelect
                renderValue={(value) => permissionsWithoutCustom[value as string] || 'No access'}
                onChange={(level) => updateSpacePagePermissionLevel(level as PagePermissionLevelType)}
                keyAndLabel={permissionsWithRemove}
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
              <div style={{ width: '160px', textAlign: 'right' }}>
                {canEdit ? (
                  <SmallSelect
                    renderValue={(value) => permissionsWithoutCustom[value as string]}
                    onChange={(level) => updatePagePermissionLevel(permission, level as PagePermissionLevelType)}
                    keyAndLabel={permissionsWithRemove}
                    defaultValue={permission.permissionLevel}
                  />
                ) : (
                  <Typography color='secondary' variant='caption'>
                    {permissionLevels[permission.permissionLevel]}
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

      <Modal {...bindPopover(popupState)} title='Invite people to this page'>
        <AddPagePermissionsForm
          existingPermissions={pagePermissions}
          pageId={pageId}
          permissionsAdded={() => {
            refreshPermissions();
            popupState.close();
          }}
        />
      </Modal>
    </Box>
  );
}
