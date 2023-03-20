import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { PostCategoryPermissionLevel } from '@prisma/client';
import { useMemo } from 'react';

import { SmallSelect } from 'components/common/form/InputEnumToOptions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRoles } from 'hooks/useRoles';
import { postCategoryPermissionLabels } from 'lib/permissions/forum/mapping';
import type { PostCategoryPermissionInput } from 'lib/permissions/forum/upsertPostCategoryPermission';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';

import { permissionsWithRemove, forumMemberPermissionOptions } from './shared';

type Props = {
  assignee: TargetPermissionGroup<'role' | 'space'>;
  existingPermissionId?: string;
  defaultPermissionLevel?: PostCategoryPermissionLevel;
  postCategoryId: string;
  canEdit: boolean;
  updatePermission: (newPermission: PostCategoryPermissionInput) => void;
  deletePermission: (permissionId: string) => void;
};

export function PostCategoryRolePermissionRow({
  assignee,
  existingPermissionId,
  postCategoryId,
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
      updatePermission({ permissionLevel: level, postCategoryId, assignee });
    }
  }

  return (
    <Box display='flex' justifyContent='space-between' alignItems='center'>
      <Typography variant='body2'>{assigneeName}</Typography>
      <div style={{ width: '120px', textAlign: 'left' }}>
        {canEdit ? (
          <SmallSelect
            data-test={assignee.group === 'space' ? 'category-space-permission' : null}
            renderValue={(value) =>
              (forumMemberPermissionOptions[value as keyof typeof forumMemberPermissionOptions] as string as any) ||
              'No access'
            }
            onChange={handleUpdate as (opt: string) => void}
            keyAndLabel={permissionsWithRemove}
            defaultValue={defaultPermissionLevel ?? 'No access'}
          />
        ) : (
          <Tooltip title='You cannot edit permissions for this forum category.'>
            <Typography color='secondary' variant='caption'>
              {defaultPermissionLevel ? postCategoryPermissionLabels[defaultPermissionLevel] : 'No access'}
            </Typography>
          </Tooltip>
        )}
      </div>
    </Box>
  );
}
