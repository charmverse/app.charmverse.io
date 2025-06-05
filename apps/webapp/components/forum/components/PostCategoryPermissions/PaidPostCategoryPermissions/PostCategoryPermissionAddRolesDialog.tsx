import type { PostCategoryPermissionLevel } from '@charmverse/core/prisma';
import Grid from '@mui/material/Grid';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { SmallSelect } from 'components/common/form/InputEnumToOptions';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import type { BulkRolePostCategoryPermissionUpsert } from 'components/forum/hooks/usePostCategoryPermissionsList';

import { forumMemberPermissionOptions } from '../shared';

type Props = {
  onClose: () => void;
  onSave: (input: BulkRolePostCategoryPermissionUpsert) => void;
  roleIdsToHide: string[];
};

const defaultPermissionLevel: PostCategoryPermissionLevel = 'full_access';

export function PostCategoryPermissionsAddRoles({ onClose, onSave, roleIdsToHide }: Props) {
  const [newRolesPermissionLevel, setNewRolesPermissionLevel] =
    useState<PostCategoryPermissionLevel>(defaultPermissionLevel);
  const [newRoleIds, setNewRoleIds] = useState<string[]>([]);

  function addRolePermissions() {
    onSave({ roleIds: newRoleIds, permissionLevel: newRolesPermissionLevel });
    setNewRoleIds([]);
    setNewRolesPermissionLevel(defaultPermissionLevel);
    onClose();
  }

  return (
    <Grid container direction='column' spacing={3}>
      <Grid container size={12} justifyContent='space-between'>
        <Grid size={8}>
          <SmallSelect
            sx={{
              textAlign: 'left'
            }}
            renderValue={(value) =>
              (forumMemberPermissionOptions[value as keyof typeof forumMemberPermissionOptions] as string as any) ||
              'No access'
            }
            onChange={(newValue) => setNewRolesPermissionLevel(newValue as PostCategoryPermissionLevel)}
            keyAndLabel={forumMemberPermissionOptions}
            defaultValue={newRolesPermissionLevel}
          />
        </Grid>
        <Grid size={4} justifyContent='flex-end'>
          <Button disableElevation fullWidth disabled={newRoleIds.length === 0} onClick={addRolePermissions}>
            Add roles
          </Button>
        </Grid>
      </Grid>
      <Grid>
        <InputSearchRoleMultiple
          filter={{ mode: 'exclude', userIds: roleIdsToHide }}
          onChange={(ids: string[]) => setNewRoleIds(ids)}
          disableCloseOnSelect
        />
      </Grid>
    </Grid>
  );
}
