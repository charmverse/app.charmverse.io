import Box from '@mui/material/Box';
import { PagePermission } from '@prisma/client';
import { IPagePermissionWithAssignee, IPagePermissionWithNestedSpaceRole } from 'lib/permissions/pages/page-permission-interfaces';
import { getDisplayName } from 'lib/users/getDisplayName';
import { useEffect, useState } from 'react';
import { PermissionLevelTitle } from 'lib/permissions/pages/page-permission-mapping';
import charmClient from 'charmClient';

const permissionDisplayOrder = ['space', 'role', 'user'];

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

  useEffect(() => {
    charmClient.listPagePermissions(pageId)
      .then(permissionSet => {
        setPagePermissions(permissionSet);
      });

  }, [pageId]);

  const sortedPermissions = sortPagePermissions(pagePermissions);

  return (
    <Box>
      Page Permissions

      <Box>
        {
              sortedPermissions.map(permission => {
                return (
                  <Box key={permission.displayName}>
                    {permission.displayName}

                    {PermissionLevelTitle[permission.permissionLevel]}
                  </Box>
                );
              })
            }
      </Box>
    </Box>
  );
}
