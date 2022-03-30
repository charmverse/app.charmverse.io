import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import Modal from 'components/common/Modal';
import charmClient from 'charmClient';
import { IPagePermissionWithAssignee, PagePermissionLevelType } from 'lib/permissions/pages/page-permission-interfaces';
import { PagePermissionLevelTitle } from 'lib/permissions/pages/page-permission-mapping';
import { getDisplayName } from 'lib/users/getDisplayName';
import { useEffect, useState } from 'react';
import { InputEnumToOptions } from 'components/common/form/InputEnumToOptions';
import { filterObjectKeys } from 'lib/utilities/objects';
import { PagePermission } from '@prisma/client';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { ElementDeleteIcon } from 'components/common/form/ElementDeleteIcon';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { AddPagePermissionsForm } from './AddPagePermissionsForm';

const permissionDisplayOrder = ['space', 'role', 'user'];

/**
 * Orders permissions logically from space to role to user
 * @sideEffect Adds an empty permission for a space
 * @param pagePermissions
 */
function sortPagePermissions (pagePermissions: IPagePermissionWithAssignee[]):
  (IPagePermissionWithAssignee & {displayName: string})[] {
  return pagePermissions.map(permission => {

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
}

interface IProps {
  pageId: string
}

export function PagePermissions ({ pageId }: IProps) {

  const [pagePermissions, setPagePermissions] = useState<IPagePermissionWithAssignee []>([]);

  const [space] = useCurrentSpace();

  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null);

  useEffect(() => {
    refreshPermissions();
  }, [pageId]);

  function refreshPermissions () {
    charmClient.listPagePermissions(pageId)
      .then(permissionSet => {
        setPagePermissions(permissionSet);
      });
  }

  async function updatePagePermissionLevel (permission: Pick<PagePermission, 'id' | 'permissionLevel'>) {
    await charmClient.updatePermission(permission.id, { permissionLevel: permission.permissionLevel });
    await refreshPermissions();

  }

  function deletePermission (permissionId: string) {
    charmClient.deletePermission(permissionId)
      .then(() => {
        refreshPermissions();
      });
  }

  const sortedPermissions = sortPagePermissions(pagePermissions);

  /** TODO LATER
  if (space) {
    const spaceIsPresent = sortedPermissions.some(permission => permission.spaceId === space.id);

    if (!spaceIsPresent) {

    }
  }
   */
  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-permission' });

  return (
    <Box>

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

      Page Permissions
      <Grid container direction='row' alignItems='center' onClick={() => popupState.open()}>
        <Grid item xs={9}>
          <Input
            type='text'
            placeholder='Add people and roles'
            readOnly
            fullWidth
          />
        </Grid>
        <Grid item xs={3}>
          <Button fullWidth>Invite</Button>
        </Grid>
      </Grid>
      <Box>
        {
              sortedPermissions.map(permission => {
                return (
                  <Box display='flex' key={permission.displayName}>
                    <Grid container direction='row' justifyContent='space-around' alignItems='center'>
                      <Grid item xs={6}>
                        {permission.displayName}
                      </Grid>
                      <Grid item xs={3} sx={{ fontSize: '12px' }}>
                        {
                          selectedPermissionId === permission.id ? (
                            <InputEnumToOptions
                              onChange={(newAccessLevel) => {

                                if (newAccessLevel !== permission.permissionLevel) {
                                  updatePagePermissionLevel({
                                    id: permission.id,
                                    permissionLevel: newAccessLevel as PagePermissionLevelType
                                  }).then(() => setSelectedPermissionId(null));
                                }
                                else {
                                  setSelectedPermissionId(null);
                                }
                              }}
                              keyAndLabel={filterObjectKeys(PagePermissionLevelTitle, 'exclude', ['custom'])}
                              defaultValue={permission.permissionLevel}
                            />
                          ) : (
                            <Box onClick={() => setSelectedPermissionId(permission.id)}>
                              {PagePermissionLevelTitle[permission.permissionLevel]}
                            </Box>
                          )
                        }

                      </Grid>
                      <Grid item xs={2} sx={{ fontSize: '10px' }}>
                        <ElementDeleteIcon onClick={() => deletePermission(permission.id)} />
                      </Grid>

                    </Grid>

                  </Box>
                );
              })
            }
      </Box>
    </Box>
  );
}
