import type { ProposalCategoryPermissionLevel } from '@charmverse/core/prisma';
import Grid from '@mui/material/Grid';
import { useState } from 'react';

import Button from 'components/common/Button';
import { SmallSelect } from 'components/common/form/InputEnumToOptions';
import { InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';

import type { BulkRoleProposalCategoryPermissionUpsert } from './shared';
import { proposalCategoryPermissionLabels } from './shared';

type Props = {
  onClose: () => void;
  onSave: (input: BulkRoleProposalCategoryPermissionUpsert) => void;
  roleIdsToHide: string[];
};

const defaultPermissionLevel: ProposalCategoryPermissionLevel = 'full_access';

export function ProposalCategoryPermissionsAddRoles({ onClose, onSave, roleIdsToHide }: Props) {
  const [newRolesPermissionLevel, setNewRolesPermissionLevel] =
    useState<ProposalCategoryPermissionLevel>(defaultPermissionLevel);
  const [newRoleIds, setNewRoleIds] = useState<string[]>([]);

  function addRolePermissions() {
    onSave({ roleIds: newRoleIds, permissionLevel: newRolesPermissionLevel });
    setNewRoleIds([]);
    setNewRolesPermissionLevel(defaultPermissionLevel);
    onClose();
  }

  const friendlyLabels = {
    ...proposalCategoryPermissionLabels,
    delete: 'Remove',
    '': 'No access'
  };

  return (
    <Grid container direction='column' spacing={3}>
      <Grid container item xs={12} justifyContent='space-between'>
        <Grid item xs={6}>
          <SmallSelect
            sx={{
              textAlign: 'left'
            }}
            renderValue={(value) => friendlyLabels[value]}
            onChange={(newValue) => setNewRolesPermissionLevel(newValue as ProposalCategoryPermissionLevel)}
            keyAndLabel={friendlyLabels}
            defaultValue={newRolesPermissionLevel}
          />
        </Grid>
        <Grid item xs={6} justifyContent='flex-end'>
          <Button disableElevation fullWidth disabled={newRoleIds.length === 0} onClick={addRolePermissions}>
            Add roles
          </Button>
        </Grid>
      </Grid>
      <Grid item>
        <InputSearchRoleMultiple
          filter={{ mode: 'exclude', userIds: roleIdsToHide }}
          onChange={(ids: string[]) => setNewRoleIds(ids)}
          disableCloseOnSelect
        />
      </Grid>
    </Grid>
  );
}
