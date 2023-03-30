import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { ProposalCategoryPermissionLevel } from '@prisma/client';
import { useMemo } from 'react';

import { SmallSelect } from 'components/common/form/InputEnumToOptions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRoles } from 'hooks/useRoles';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';
import { proposalCategoryPermissionLabels } from 'lib/permissions/proposals/mapping';
import type { ProposalCategoryPermissionInput } from 'lib/permissions/proposals/upsertProposalCategoryPermission';

import { proposalCategoryPermissionOptions, permissionsWithRemove } from './shared';

type Props = {
  assignee: TargetPermissionGroup<'role' | 'space'>;
  existingPermissionId?: string;
  isInherited?: boolean;
  label?: string;
  defaultPermissionLevel?: ProposalCategoryPermissionLevel;
  emptyValue?: ProposalCategoryPermissionLevel;
  proposalCategoryId: string;
  canEdit: boolean;
  updatePermission: (newPermission: ProposalCategoryPermissionInput) => void;
  deletePermission?: (permissionId: string) => void;
};

export function ProposalCategoryRolePermissionRow({
  assignee,
  existingPermissionId,
  isInherited,
  proposalCategoryId,
  defaultPermissionLevel,
  emptyValue,
  canEdit,
  label,
  updatePermission,
  deletePermission
}: Props) {
  const roles = useRoles();
  const space = useCurrentSpace();

  const emptyLabel = (emptyValue && proposalCategoryPermissionOptions[emptyValue]) || 'No access';

  const assigneeName = useMemo(() => {
    if (label) return label;
    return assignee.group === 'space'
      ? `Everyone at ${space?.name}`
      : roles.roles?.find((r) => r.id === assignee.id)?.name;
  }, [label, roles, space]);

  function handleUpdate(level: keyof typeof permissionsWithRemove) {
    if (level === 'delete' && existingPermissionId && deletePermission) {
      deletePermission(existingPermissionId);
    } else if (level !== 'delete') {
      updatePermission({ permissionLevel: level, proposalCategoryId, assignee });
    }
  }

  return (
    <Box display='flex' justifyContent='space-between' alignItems='center'>
      <Typography variant='body2'>{assigneeName}</Typography>
      <div style={{ width: '160px', textAlign: 'left' }}>
        {canEdit ? (
          <Tooltip
            title={
              isInherited
                ? 'Inherited from Member role'
                : defaultPermissionLevel === 'full_access'
                ? 'Full access allows all assignees to create proposals in this category'
                : ''
            }
          >
            <span>
              <SmallSelect
                data-test={assignee.group === 'space' ? 'category-space-permission' : null}
                sx={{ opacity: isInherited ? 0.5 : 1 }}
                renderValue={(value) => (value !== '' && proposalCategoryPermissionOptions[value]) || emptyLabel}
                onChange={handleUpdate as (opt: string) => void}
                keyAndLabel={permissionsWithRemove}
                defaultValue={defaultPermissionLevel || ''}
                displayEmpty
              />
            </span>
          </Tooltip>
        ) : (
          <Tooltip title='You cannot edit permissions for this forum category.'>
            <Typography color='secondary' variant='caption'>
              {defaultPermissionLevel ? proposalCategoryPermissionLabels[defaultPermissionLevel] : 'No access'}
            </Typography>
          </Tooltip>
        )}
      </div>
    </Box>
  );
}
