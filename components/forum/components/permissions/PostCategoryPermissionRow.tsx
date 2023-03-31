import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { PostCategoryPermissionLevel } from '@prisma/client';
import { useMemo } from 'react';

import { SmallSelect } from 'components/common/form/InputEnumToOptions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRoles } from 'hooks/useRoles';
import type { PostCategoryPermissionInput } from 'lib/permissions/forum/upsertPostCategoryPermission';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';

import { permissionsWithRemove, postCategoryPermissionLabels } from './shared';

type Props = {
  assignee: TargetPermissionGroup<'role' | 'space'>;
  existingPermissionId?: string;
  defaultPermissionLevel?: PostCategoryPermissionLevel;
  emptyValue?: PostCategoryPermissionLevel;
  isInherited?: boolean;
  label?: string;
  postCategoryId: string;
  canEdit: boolean;
  disabledTooltip?: string;
  updatePermission: (newPermission: PostCategoryPermissionInput) => void;
  deletePermission: (permissionId: string) => void;
};

export function PostCategoryRolePermissionRow({
  assignee,
  existingPermissionId,
  postCategoryId,
  defaultPermissionLevel,
  emptyValue,
  isInherited,
  label,
  canEdit,
  disabledTooltip,
  updatePermission,
  deletePermission
}: Props) {
  const roles = useRoles();
  const space = useCurrentSpace();
  const emptyLabel = (emptyValue && postCategoryPermissionLabels[emptyValue]) || 'No access';

  const assigneeName = useMemo(() => {
    return assignee.group === 'space'
      ? `Everyone at ${space?.name}`
      : roles.roles?.find((r) => r.id === assignee.id)?.name;
  }, [roles, space]);

  function handleUpdate(level: keyof typeof permissionsWithRemove) {
    if (level === 'delete' && existingPermissionId) {
      deletePermission(existingPermissionId);
    } else if (level !== 'delete') {
      updatePermission({ permissionLevel: level, postCategoryId, assignee });
    }
  }

  const tooltip = !canEdit
    ? disabledTooltip || 'You do not have permission to edit this permission'
    : isInherited
    ? 'Inherited from Member role'
    : '';

  return (
    <Box display='flex' justifyContent='space-between' alignItems='center'>
      <Typography variant='body2'>{label || assigneeName}</Typography>
      <div style={{ width: '120px', textAlign: 'left' }}>
        <Tooltip title={tooltip}>
          <span>
            <SmallSelect
              disabled={!canEdit}
              data-test={assignee.group === 'space' ? 'category-space-permission' : null}
              sx={{ opacity: isInherited ? 0.5 : 1 }}
              renderValue={(value) => (value !== '' && postCategoryPermissionLabels[value]) || emptyLabel}
              onChange={handleUpdate as (opt: string) => void}
              keyAndLabel={permissionsWithRemove}
              defaultValue={defaultPermissionLevel || ''}
              displayEmpty
            />
          </span>
        </Tooltip>
      </div>
    </Box>
  );
}
