/* eslint-disable camelcase */
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { PostCategoryPermissionLevel } from '@prisma/client';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { SmallSelect } from 'components/common/form/InputEnumToOptions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRoles } from 'hooks/useRoles';
import type { PostCategoryPermissionInput } from 'lib/permissions/forum/upsertPostCategoryPermission';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';

import { postCategoryPermissionLabels } from './shared';

type Props = {
  assignee: TargetPermissionGroup<'role' | 'space'>;
  existingPermissionId?: string;
  defaultPermissionLevel?: PostCategoryPermissionLevel;
  inheritedPermissionLevel?: PostCategoryPermissionLevel;
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
  inheritedPermissionLevel,
  label,
  canEdit,
  disabledTooltip,
  updatePermission,
  deletePermission
}: Props) {
  const roles = useRoles();
  const space = useCurrentSpace();

  const isInherited = inheritedPermissionLevel && !defaultPermissionLevel;

  const { full_access, view } = postCategoryPermissionLabels;

  const friendlyLabels = {
    full_access,
    view,
    delete: (inheritedPermissionLevel ? (
      <em>Default: {postCategoryPermissionLabels[inheritedPermissionLevel]}</em>
    ) : (
      'Remove'
    )) as string | ReactNode | undefined,
    '': (inheritedPermissionLevel && postCategoryPermissionLabels[inheritedPermissionLevel]) || 'No access'
  };

  // remove delete option if there is no existing permission
  if (!existingPermissionId) {
    delete friendlyLabels.delete;
  }

  const assigneeName = useMemo(() => {
    return assignee.group === 'space' ? `Default permissions` : roles.roles?.find((r) => r.id === assignee.id)?.name;
  }, [roles, space]);

  function handleUpdate(level: keyof typeof friendlyLabels) {
    if (level === 'delete' && existingPermissionId) {
      deletePermission(existingPermissionId);
    } else if (level !== 'delete' && level !== '') {
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
      <div style={{ width: '150px', textAlign: 'left' }}>
        <Tooltip title={tooltip}>
          <span>
            <SmallSelect
              disabled={!canEdit}
              data-test={assignee.group === 'space' ? 'category-space-permission' : null}
              sx={{ opacity: isInherited ? 0.5 : 1 }}
              renderValue={(value) => friendlyLabels[value as keyof typeof friendlyLabels]}
              onChange={handleUpdate as (opt: string) => void}
              keyAndLabel={friendlyLabels}
              defaultValue={defaultPermissionLevel || ''}
              displayEmpty
            />
          </span>
        </Tooltip>
      </div>
    </Box>
  );
}
