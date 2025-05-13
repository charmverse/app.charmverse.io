/* eslint-disable camelcase */
import type { PostCategoryPermissionAssignment } from '@charmverse/core/permissions';
import type { PostCategoryPermissionLevel } from '@charmverse/core/prisma';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { SmallSelect } from 'components/common/form/InputEnumToOptions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRoles } from 'hooks/useRoles';
import type { TargetPermissionGroup } from '@packages/lib/permissions/interfaces';

import { forumMemberPermissionOptions, postCategoryPermissionLabels } from '../shared';

type Props = {
  assignee: TargetPermissionGroup<'role' | 'space'>;
  existingPermissionId?: string;
  permissionLevel?: PostCategoryPermissionLevel;
  defaultPermissionLevel?: PostCategoryPermissionLevel;
  label?: string;
  postCategoryId: string;
  canEdit: boolean;
  disabledTooltip?: string;
  updatePermission?: (newPermission: PostCategoryPermissionAssignment & { id?: string }) => void;
  deletePermission?: (permissionId: string) => void;
};

export function PostCategoryRolePermissionRow({
  assignee,
  existingPermissionId,
  postCategoryId,
  permissionLevel,
  defaultPermissionLevel,
  label,
  canEdit,
  disabledTooltip,
  updatePermission,
  deletePermission
}: Props) {
  const { roles } = useRoles();
  const { space } = useCurrentSpace();

  const defaultExists = !!defaultPermissionLevel;
  const usingDefault = defaultExists && !existingPermissionId;

  const friendlyLabels = {
    ...forumMemberPermissionOptions,
    delete: (assignee.group !== 'space' && defaultExists ? (
      <em>Default: {postCategoryPermissionLabels[defaultPermissionLevel]}</em>
    ) : (
      'Remove'
    )) as string | ReactNode | undefined,
    '': (defaultPermissionLevel && postCategoryPermissionLabels[defaultPermissionLevel]) || 'No access'
  };

  // remove delete option if there is no existing permission
  if (!existingPermissionId && !defaultExists) {
    delete friendlyLabels.delete;
  }

  const assigneeName = useMemo(() => {
    if (label) return label;
    return assignee.group === 'space' ? `Default permissions` : roles?.find((r) => r.id === assignee.id)?.name;
  }, [label, roles, space]);

  function handleUpdate(level: keyof typeof friendlyLabels) {
    if (level === 'delete' && existingPermissionId) {
      deletePermission?.(existingPermissionId);
    } else if (level !== 'delete' && level !== '') {
      updatePermission?.({ id: existingPermissionId, permissionLevel: level, postCategoryId, assignee });
    }
  }

  const tooltip = !canEdit
    ? disabledTooltip || 'You cannot edit permissions for this category'
    : usingDefault
      ? 'Default setting'
      : '';

  return (
    <Box display='flex' justifyContent='space-between' alignItems='center'>
      <Typography variant='body2'>{label || assigneeName}</Typography>
      <div style={{ width: '180px', textAlign: 'left' }}>
        <Tooltip title={tooltip}>
          <span>
            <SmallSelect
              disabled={!canEdit}
              data-test={assignee.group === 'space' ? 'category-space-permission' : null}
              sx={{ opacity: !permissionLevel || usingDefault ? 0.5 : 1 }}
              renderValue={(value) => friendlyLabels[value as keyof typeof friendlyLabels]}
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
