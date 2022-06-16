
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import charmClient from 'charmClient';
import Loader from 'components/common/Loader';
import useIsAdmin from 'hooks/useIsAdmin';
import { useEffect, useState } from 'react';

import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { SpaceOperation } from '@prisma/client';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { AssignablePermissionGroups } from 'lib/permissions/interfaces';
import { spaceOperationLabels, SpacePermissionFlags } from 'lib/permissions/spaces/client';

/**
 * @param callback Used to tell the parent the operation is complete. Useful for triggering refreshes
 */
interface Props {
  targetGroup: AssignablePermissionGroups;
  id: string,
  callback?: () => void
}

export default function SpacePermissions ({ targetGroup, id, callback = () => null }: Props) {

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
      callback();
    }
  }

  async function refreshGroupPermissions () {

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
