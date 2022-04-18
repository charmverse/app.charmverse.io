import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/OutlinedInput';
import Modal from 'components/common/Modal';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import charmClient from 'charmClient';
import { IPagePermissionFlags, IPagePermissionWithAssignee, PagePermissionLevelType } from 'lib/permissions/pages/page-permission-interfaces';
import { permissionLevels } from 'lib/permissions/pages/page-permission-mapping';
import { getDisplayName } from 'lib/users/getDisplayName';
import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import InputEnumToOptions from 'components/common/form/InputEnumToOptions';
import { PagePermission, PagePermissionLevel, Space } from '@prisma/client';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { ElementDeleteIcon } from 'components/common/form/ElementDeleteIcon';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { usePages } from 'hooks/usePages';
import { updatePagePermission } from 'lib/permissions/pages/page-permission-actions';
import Link from 'components/common/Link';
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
function sortPagePermissions (pagePermissions: IPagePermissionWithAssignee[], space?: Space):
  (IPagePermissionWithAssignee & {displayName: string})[] {
  const sortedPermissions = pagePermissions
    .filter(permission => {
      return !permission.spaceId;
    })
    .map(permission => {

      const permissionSource = permission.user ? 'user' : permission.role ? 'role' : 'space';

      const permissionDisplayName = permissionSource === 'user' ? getDisplayName(permission.user!) : permissionSource === 'role' ? permission.role!.name : `${permission.space!.name} members`;

      return {
        ...permission,
        permissionSource,
        displayName: permissionDisplayName
      };
    }).sort((a, b) => {

      const aPermission = permissionDisplayOrder.indexOf(a.permissionSource);
      const bPermission = permissionDisplayOrder.indexOf(b.permissionSource);

      if (aPermission < bPermission) {
        return -1;
      }
      else if (aPermission > bPermission) {
        return 1;
      }
      else {
        return 0;
      }
    });

  return sortedPermissions;
}

interface Props {
  pageId: string
}

export default function PagePermissions ({ pageId }: Props) {

  const [pagePermissions, setPagePermissions] = useState<IPagePermissionWithAssignee []>([]);
  const { pages } = usePages();
  const [space] = useCurrentSpace();
  const { getPagePermissions } = usePages();
  const [userPagePermissions, setUserPagePermissions] = useState<null | IPagePermissionFlags>(null);
  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null);
  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-permission' });

  const [spaceLevelPermission, setSpaceLevelPermission] = useState<IPagePermissionWithAssignee | null>(null);

  // Only used on first run
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    refreshPermissions();
  }, [pageId]);

  function refreshPermissions () {

    const userPermissions = getPagePermissions(pageId);
    setUserPagePermissions(userPermissions);

    charmClient.listPagePermissions(pageId)
      .then(permissionSet => {

        const _spaceLevelPermission = permissionSet.find(permission => space && permission.spaceId === space?.id);

        setSpaceLevelPermission(_spaceLevelPermission ?? null);
        setPagePermissions(permissionSet);
        setPermissionsLoaded(true);
      });
  }

  async function updateSpacePagePermissionLevel (permissionLevel: PagePermissionLevelType | 'delete') {
    if (permissionLevel === 'delete') {
      if (spaceLevelPermission) {
        await charmClient.deletePermission(spaceLevelPermission.id);
      }
    }
    else if (!spaceLevelPermission && space) {
      await charmClient.createPermission({
        pageId,
        permissionLevel,
        spaceId: space.id
      });
    }
    else if (spaceLevelPermission) {
      await charmClient.updatePermission(spaceLevelPermission.id, {
        permissionLevel
      });
    }
    await refreshPermissions();
    setSelectedPermissionId(null);
  }

  async function updatePagePermissionLevel (permission: IPagePermissionWithAssignee, permissionLevel: PagePermissionLevelType | 'delete') {

    if (permissionLevel === 'delete') {
      await charmClient.deletePermission(permission.id);
    }
    else if (permissionLevel !== permission.permissionLevel) {
      await charmClient.updatePermission(permission.id, { permissionLevel });
    }
    await refreshPermissions();
    setSelectedPermissionId(null);
  }

  const sortedPermissions = sortPagePermissions(pagePermissions);

  const { custom, ...permissionsWithoutCustom } = permissionLevels as Record<string, string>;
  const permissionsWithRemove = { ...permissionsWithoutCustom, delete: 'Remove' };

  return (
    <Box padding={1}>

      {userPagePermissions?.grant_permissions === true && (
        <Box mb={1} onClick={() => popupState.open()}>
          <StyledInput
            placeholder='Add people and roles'
            fullWidth
            readOnly
            endAdornment={(
              <InputAdornment position='end'>
                <Button disableElevation>Invite</Button>
              </InputAdornment>
            )}
          />
        </Box>
      )}

      <Box display='block' py={0.5}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2'>
            Everyone at {space?.name}
          </Typography>
          <div style={{ width: '120px', textAlign: 'center' }}>
            {
            selectedPermissionId === 'space' ? (
              <InputEnumToOptions
                onChange={level => updateSpacePagePermissionLevel(level as PagePermissionLevelType)}
                keyAndLabel={permissionsWithRemove}
                defaultValue={spaceLevelPermission?.permissionLevel}
              />
            ) : (
              <div onClick={() => {
                if (userPagePermissions?.grant_permissions === true) {
                  setSelectedPermissionId('space');
                }
              }}
              >
                <Typography color='secondary' variant='caption'>
                  {spaceLevelPermission ? permissionsWithoutCustom[spaceLevelPermission.permissionLevel] : (permissionsLoaded ? 'No access' : '')}
                </Typography>
              </div>
            )
          }
          </div>
        </Box>
        {

          spaceLevelPermission?.sourcePermission && (
            <Box display='block'>
              <Typography variant='caption'>
                Inherited from
                <Link sx={{ ml: 0.5 }} href={`/${space?.domain}/${pages[spaceLevelPermission?.sourcePermission.pageId]?.path}`}>
                  {pages[spaceLevelPermission?.sourcePermission.pageId]?.title || 'Untitled'}
                </Link>
              </Typography>
            </Box>
          )
        }

      </Box>

      {
        sortedPermissions.map(permission => {
          return (
            <Box display='block' py={0.5}>
              <Box display='flex' justifyContent='space-between' alignItems='center' key={permission.displayName}>
                <Typography variant='body2'>
                  {permission.displayName}
                </Typography>
                <div style={{ width: '120px', textAlign: 'center' }}>
                  {
                  selectedPermissionId === permission.id ? (
                    <InputEnumToOptions
                      onChange={level => updatePagePermissionLevel(permission, level as PagePermissionLevelType)}
                      keyAndLabel={permissionsWithRemove}
                      defaultValue={permission.permissionLevel}
                    />
                  ) : (
                    <div onClick={() => {
                      if (userPagePermissions?.grant_permissions === true) {
                        setSelectedPermissionId(permission.id);
                      }
                    }}
                    >
                      <Typography color='secondary' variant='caption'>
                        {permissionLevels[permission.permissionLevel]}
                      </Typography>
                    </div>
                  )
                }
                </div>
              </Box>
              {
              permission.sourcePermission && (
                <Box display='block'>
                  <Typography variant='caption'>
                    Inherited from
                    <Link sx={{ ml: 0.5 }} href={`/${space?.domain}/${pages[permission.sourcePermission.pageId]?.path}`}>
                      {pages[permission.sourcePermission.pageId]?.title || 'Untitled'}
                    </Link>
                  </Typography>
                </Box>
              )
             }
            </Box>

          );
        })
      }

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
