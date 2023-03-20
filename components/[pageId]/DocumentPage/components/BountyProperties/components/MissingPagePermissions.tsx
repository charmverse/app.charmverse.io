import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import type { BountyPermissionLevel } from '@prisma/client';

import { useMembers } from 'hooks/useMembers';
import { useRoles } from 'hooks/useRoles';
import type { BountyPermissionGroup, BountyPermissions } from 'lib/bounties';
import type { PagePermissionMeta } from 'lib/permissions/interfaces';
import { isTruthy } from 'lib/utilities/types';

interface Props {
  bountyPermissions: Partial<BountyPermissions>;
  pagePermissions: PagePermissionMeta[];
  target: Extract<BountyPermissionLevel, 'reviewer' | 'submitter'>;
}

export function MissingPagePermissions({ bountyPermissions, pagePermissions, target }: Props) {
  const { roles } = useRoles();
  const { members } = useMembers();

  const visibleToSpace = pagePermissions.some((p) => isTruthy(p.spaceId) || p.public === true);

  // Compare each existing assignee against page permissions
  const assigneesMissingPermissions = visibleToSpace
    ? []
    : ((bountyPermissions[target] ?? []).filter(
        (bountyPermissionAssignee) =>
          bountyPermissionAssignee.group !== 'public' &&
          !pagePermissions.some((pp) => {
            // Make sure there are no individual user permissions, or roles through which they can see this page
            if (bountyPermissionAssignee.group === 'user') {
              const canSeePageViaRole = pp.roleId
                ? members.some(
                    (member) =>
                      member.id === bountyPermissionAssignee.id && member.roles.some((role) => role.id === pp.roleId)
                  )
                : false;

              return pp.userId === bountyPermissionAssignee.id || !!canSeePageViaRole;
            } else {
              return pp.roleId === bountyPermissionAssignee.id;
            }
          })
      ) as BountyPermissionGroup[]);

  if (assigneesMissingPermissions.length === 0) {
    return null;
  }

  const missingPermissionsWithName: (BountyPermissionGroup & { name: string })[] = assigneesMissingPermissions.map(
    (assignee) => {
      return {
        ...assignee,
        name:
          (assignee.group === 'user'
            ? members.find((c) => c.id === assignee.id)?.username
            : roles?.find((r) => r.id === assignee.id)?.name) || ''
      };
    }
  );

  return (
    <Alert severity='warning'>
      {missingPermissionsWithName.map((bountyPermissionAssignee) => (
        <Typography key={bountyPermissionAssignee.id} variant='caption' display='flex' sx={{ alignItems: 'center' }}>
          {bountyPermissionAssignee.group === 'space'
            ? 'Space members'
            : bountyPermissionAssignee.group === 'role'
            ? `${bountyPermissionAssignee.name} role`
            : `${bountyPermissionAssignee.name}`}{' '}
          cannot view this page
        </Typography>
      ))}
    </Alert>
  );
}
