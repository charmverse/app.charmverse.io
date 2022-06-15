
import Box from '@mui/material/Box';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import Legend from 'components/settings/Legend';
import Grid from '@mui/material/Grid';
import ImportGuildRolesMenuItem from 'components/settings/roles/components/ImportGuildRolesMenuItem';
import useRoles from 'components/settings/roles/hooks/useRoles';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import useIsAdmin from 'hooks/useIsAdmin';
import { useRef, useState, useEffect } from 'react';
import { Menu } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Loader from 'components/common/Loader';
import charmClient from 'charmClient';

import { spaceOperationLabels, SpacePermissionFlags } from 'lib/permissions/spaces/client';
import { AssignablePermissionGroups, PermissionAssigneeId } from 'lib/permissions/interfaces';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { SpaceOperation } from '@prisma/client';

interface Props {
  targetGroup: AssignablePermissionGroups;
  id: string
}

export default function SpacePermissions ({ targetGroup, id }: Props) {

  const [assignedPermissions, setAssignedPermissions] = useState<SpacePermissionFlags | null>(null);

  const [space] = useCurrentSpace();

  const isAdmin = useIsAdmin();

  async function togglePermission ({
    operation,
    hasAccess
  }: {operation: SpaceOperation, hasAccess: boolean}) {
    if (space) {
      if (hasAccess === false) {
        await charmClient.removeSpacePermissions({
          forSpaceId: space.id,
          operations: [operation],
          roleId: targetGroup === 'role' ? id : undefined,
          spaceId: targetGroup === 'space' ? id : undefined,
          userId: targetGroup === 'user' ? id : undefined
        } as any);
      }
      else if (hasAccess === true) {
        await charmClient.addSpacePermissions({
          forSpaceId: space.id,
          operations: [operation],
          roleId: targetGroup === 'role' ? id : undefined,
          spaceId: targetGroup === 'space' ? id : undefined,
          userId: targetGroup === 'user' ? id : undefined
        } as any);
      }

      // Force a refresh of rendered components
      setAssignedPermissions(null);
      refreshGroupPermissions();
    }
  }

  async function refreshGroupPermissions () {

    console.log('Refreshing', space);

    if (!space) {
      setTimeout(() => {
        return refreshGroupPermissions();
      }, 1000);
    }
    else {
      const permissionFlags = await charmClient.queryGroupSpacePermissions({
        group: targetGroup,
        id,
        resourceId: space.id
      });

      setAssignedPermissions(permissionFlags);
    }
  }

  useEffect(() => {
    refreshGroupPermissions();
  }, []);

  if (!assignedPermissions) {
    return <Box sx={{ height: 100 }}><Loader size={20} sx={{ height: 600 }} /></Box>;
  }

  return (
    <Grid container direction='column'>

      {
          (Object.keys(spaceOperationLabels) as SpaceOperation[]).map(operation => {
            return (
              <Grid xs>
                <FormControlLabel
                  control={(
                    <Switch
                      disabled={!isAdmin}
                      onChange={(ev) => {
                        const { checked: hasAccess } = ev.target;
                        togglePermission({
                          operation,
                          hasAccess
                        });
                      }}
                      defaultChecked={assignedPermissions[operation] === true}
                    />
                  )}
                  label={spaceOperationLabels[operation]}
                />

              </Grid>
            );
          })
        }

    </Grid>

  );
}
