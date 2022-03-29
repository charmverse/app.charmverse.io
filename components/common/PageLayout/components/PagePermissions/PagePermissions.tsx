import Box from '@mui/material/Box';
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

  useEffect(() => {
    refreshPermissions();
  }, [pageId]);

  function refreshPermissions () {
    charmClient.listPagePermissions(pageId)
      .then(permissionSet => {
        setPagePermissions(permissionSet);
      });
  }

  function updatePagePermissionLevel (permission: Pick<PagePermission, 'id' | 'permissionLevel'>) {
    charmClient.updatePermission(permission.id, { permissionLevel: permission.permissionLevel });
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

  return (
    <Box>
      Page Permissions

      <AddPagePermissionsForm existingPermissions={pagePermissions} pageId={pageId} permissionsAdded={refreshPermissions} />

      <Box>
        {
              sortedPermissions.map(permission => {
                return (
                  <Box key={permission.displayName}>
                    {permission.displayName}

                    <InputEnumToOptions
                      onChange={(newAccessLevel) => {
                        if (newAccessLevel !== permission.permissionLevel) {
                          updatePagePermissionLevel({
                            id: permission.id,
                            permissionLevel: newAccessLevel as PagePermissionLevelType
                          });
                        }
                      }}
                      keyAndLabel={filterObjectKeys(PagePermissionLevelTitle, 'exclude', ['custom'])}
                      defaultValue={permission.permissionLevel}
                    />

                    <ElementDeleteIcon onClick={() => deletePermission(permission.id)} />

                  </Box>
                );
              })
            }
      </Box>
    </Box>
  );
}
