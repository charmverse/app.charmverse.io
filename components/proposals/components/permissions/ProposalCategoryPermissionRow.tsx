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
  defaultPermissionLevel?: ProposalCategoryPermissionLevel;
  proposalCategoryId: string;
  canEdit: boolean;
  updatePermission: (newPermission: ProposalCategoryPermissionInput) => void;
  deletePermission: (permissionId: string) => void;
};

export function ProposalCategoryRolePermissionRow({
  assignee,
  existingPermissionId,
  proposalCategoryId,
  defaultPermissionLevel,
  canEdit,
  updatePermission,
  deletePermission
}: Props) {
  const roles = useRoles();
  const space = useCurrentSpace();

  const assigneeName = useMemo(() => {
    return assignee.group === 'space'
      ? `Everyone at ${space?.name}`
      : roles.roles?.find((r) => r.id === assignee.id)?.name;
  }, [roles, space]);

  function handleUpdate(level: keyof typeof permissionsWithRemove) {
    if (level === 'delete' && existingPermissionId) {
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
              defaultPermissionLevel === 'full_access'
                ? 'Full access allows all assignees to create proposals in this category'
                : ''
            }
          >
            <SmallSelect
              data-test={assignee.group === 'space' ? 'category-space-permission' : null}
              renderValue={(value) =>
                (proposalCategoryPermissionOptions[
                  value as keyof typeof proposalCategoryPermissionOptions
                ] as string as any) || 'No access'
              }
              onChange={handleUpdate as (opt: string) => void}
              keyAndLabel={permissionsWithRemove}
              defaultValue={defaultPermissionLevel ?? 'No access'}
            />
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
