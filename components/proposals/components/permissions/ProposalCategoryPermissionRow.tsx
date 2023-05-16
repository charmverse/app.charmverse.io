import type { ProposalCategoryPermissionLevel } from '@charmverse/core/prisma';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { SmallSelect } from 'components/common/form/InputEnumToOptions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRoles } from 'hooks/useRoles';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';
import type { ProposalCategoryPermissionInput } from 'lib/permissions/proposals/upsertProposalCategoryPermission';

import { proposalCategoryPermissionLabels } from './shared';

type Props = {
  assignee: TargetPermissionGroup<'role' | 'space'>;
  existingPermissionId?: string;
  label?: string;
  permissionLevel?: ProposalCategoryPermissionLevel;
  defaultPermissionLevel?: ProposalCategoryPermissionLevel;
  proposalCategoryId: string;
  canEdit: boolean;
  updatePermission: (newPermission: ProposalCategoryPermissionInput & { id?: string }) => void;
  deletePermission?: (permissionId: string) => void;
};

export function ProposalCategoryRolePermissionRow({
  assignee,
  existingPermissionId,
  proposalCategoryId,
  permissionLevel,
  defaultPermissionLevel,
  canEdit,
  label,
  updatePermission,
  deletePermission
}: Props) {
  const roles = useRoles();
  const space = useCurrentSpace();

  const usingDefault = (defaultPermissionLevel && !permissionLevel) || (!defaultPermissionLevel && !permissionLevel);

  const friendlyLabels = {
    ...proposalCategoryPermissionLabels,
    delete: (defaultPermissionLevel ? (
      <em>Default: {proposalCategoryPermissionLabels[defaultPermissionLevel]}</em>
    ) : (
      'Remove'
    )) as string | ReactNode | undefined,
    '': (defaultPermissionLevel && proposalCategoryPermissionLabels[defaultPermissionLevel]) || 'No access'
  };

  // remove delete option if there is no existing permission
  if (!existingPermissionId) {
    delete friendlyLabels.delete;
  }

  const assigneeName = useMemo(() => {
    if (label) return label;
    return assignee.group === 'space' ? `Default permissions` : roles.roles?.find((r) => r.id === assignee.id)?.name;
  }, [label, roles, space]);

  function handleUpdate(level: keyof typeof friendlyLabels) {
    if (level === 'delete' && existingPermissionId && deletePermission) {
      deletePermission(existingPermissionId);
    } else if (level !== 'delete' && level !== '') {
      updatePermission({ id: existingPermissionId, permissionLevel: level, proposalCategoryId, assignee });
    }
  }

  const tooltip = !canEdit
    ? 'You do not have permission to edit this permission'
    : usingDefault
    ? 'Default setting'
    : permissionLevel === 'full_access'
    ? 'Full access allows all assignees to create proposals in this category'
    : '';

  return (
    <Box display='flex' justifyContent='space-between' alignItems='center'>
      <Typography variant='body2'>{assigneeName}</Typography>
      <div style={{ width: '200px', textAlign: 'left' }}>
        <Tooltip title={tooltip} enterDelay={1000} disableInteractive>
          <span>
            <SmallSelect
              disabled={!canEdit}
              data-test={assignee.group === 'space' ? 'category-space-permission' : null}
              sx={{ opacity: usingDefault ? 0.5 : 1 }}
              renderValue={(value) => friendlyLabels[value]}
              onChange={handleUpdate as (opt: string) => void}
              keyAndLabel={friendlyLabels}
              defaultValue={permissionLevel || ''}
              displayEmpty
            />
          </span>
        </Tooltip>
      </div>
    </Box>
  );
}
