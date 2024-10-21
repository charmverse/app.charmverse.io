/* eslint-disable camelcase */
import type {
  AssignablePagePermissionGroups,
  AssignedPagePermission,
  PagePermissionAssignmentByValues
} from '@charmverse/core/permissions';
import CheckIcon from '@mui/icons-material/Check';
import { Box, ListItemText, ListItemIcon, Tooltip } from '@mui/material';
import { useMemo } from 'react';

import { SmallSelect } from 'components/common/form/InputEnumToOptions';
import { Typography } from 'components/common/Typography';
import { useMembers } from 'hooks/useMembers';
import { useRoles } from 'hooks/useRoles';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';
import type { ApplicablePagePermissionLevel } from 'lib/permissions/pages/labels';
import { pagePermissionLevels } from 'lib/permissions/pages/labels';

import { GuestChip } from '../common/GuestChip';
import { ReadonlyPagePermissionRow } from '../common/ReadonlyPagePermissionRow';

import { PermissionInheritedFrom } from './PermissionInheritedFrom';

type Props = {
  assignee: TargetPermissionGroup<Exclude<AssignablePagePermissionGroups, 'public'>>;
  existingPermission?: AssignedPagePermission<Exclude<AssignablePagePermissionGroups, 'public'>>;
  onChange: (assignment: PagePermissionAssignmentByValues<Exclude<AssignablePagePermissionGroups, 'public'>>) => void;
  onDelete: (permissionId: string) => void;
  editable: boolean;
};

const permissionsWithRemove = {
  ...pagePermissionLevels,
  delete: 'Remove'
};

export function PagePermissionRow({ assignee, editable, onChange, onDelete, existingPermission }: Props) {
  const { roles } = useRoles();
  const { members } = useMembers();

  const role = assignee.group === 'role' ? roles?.find((r) => r.id === assignee.id) : null;

  const member = assignee.group === 'user' ? members.find((m) => m.id === assignee.id) : null;

  const isDefaultPermission = assignee.group === 'space';

  const assigneeLabel = isDefaultPermission
    ? 'Default permissions'
    : assignee.group === 'role'
      ? role?.name
      : assignee.group === 'user'
        ? member?.username
        : '';

  const isGuest = assignee.group === 'user' && !!member?.isGuest;
  const currentValue = existingPermission?.permissionLevel;

  const permissionOptions = useMemo(() => {
    const permissionsList = Object.entries(permissionsWithRemove) as [
      keyof typeof pagePermissionLevels | 'delete',
      string
    ][];
    const options = permissionsList.reduce(
      (acc, [level, label]) => {
        acc[level] = (
          <>
            <ListItemText sx={{ pr: 1 }}>
              {level === 'delete' && isDefaultPermission ? 'No access' : label}
            </ListItemText>
            {currentValue === level && <CheckIcon fontSize='small' />}
            {level === 'delete' && !currentValue && <CheckIcon fontSize='small' />}
          </>
        );
        return acc;
      },
      {} as Record<keyof typeof pagePermissionLevels | 'delete', JSX.Element>
    );
    return options;
  }, [isDefaultPermission, currentValue]);

  if (!editable) {
    return (
      <Box display='block'>
        <ReadonlyPagePermissionRow
          assignee={assigneeLabel as string}
          value={
            existingPermission?.permissionLevel
              ? permissionsWithRemove[existingPermission.permissionLevel as ApplicablePagePermissionLevel]
              : 'No access'
          }
          isGuest={isGuest}
        />
        {existingPermission?.sourcePermission && <PermissionInheritedFrom permission={existingPermission} />}
      </Box>
    );
  }

  return (
    <Box display='block'>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/** Only show the tooltip for very long names */}
          <Tooltip title={assigneeLabel && assigneeLabel.length > 22 ? assigneeLabel : ''}>
            <Typography sx={{ maxWidth: '190px', textOverflow: 'ellipsis', overflowX: 'hidden' }} variant='body2'>
              {assigneeLabel}
            </Typography>
          </Tooltip>
          {isGuest && <GuestChip />}
        </div>
        <div style={{ width: '160px', textAlign: 'right' }}>
          <SmallSelect
            renderValue={(value) => {
              if (!value) {
                return 'No access';
              }
              return permissionsWithRemove[value] ?? 'No access';
            }}
            onChange={(level: keyof typeof permissionsWithRemove) => {
              if (level === 'delete' && existingPermission) {
                onDelete(existingPermission.id);
              } else if (level !== 'delete') {
                onChange({
                  assignee,
                  permissionLevel: level as ApplicablePagePermissionLevel
                });
              }
            }}
            keyAndLabel={permissionOptions}
            value={(existingPermission?.permissionLevel as ApplicablePagePermissionLevel | undefined) ?? 'No access'}
          />
        </div>
      </Box>
      {existingPermission?.sourcePermission && <PermissionInheritedFrom permission={existingPermission} />}
    </Box>
  );
}
