import type { AssignedPagePermission, TargetPermissionGroup } from '@charmverse/core/permissions';
import type { BountyPermissionLevel } from '@charmverse/core/prisma';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import { useMembers } from 'hooks/useMembers';
import { useRoles } from 'hooks/useRoles';
import type { BountyPermissionGroup, BountyPermissions } from 'lib/bounties';

interface Props {
  bountyPermissions: Partial<BountyPermissions>;
  pagePermissions: AssignedPagePermission[];
  target: Extract<BountyPermissionLevel, 'reviewer' | 'submitter'>;
}

export function MissingPagePermissions({ bountyPermissions, pagePermissions, target }: Props) {
  const { roles } = useRoles();
  const { members } = useMembers();

  const visibleToSpace = pagePermissions.some((p) => p.assignee.group === 'space' || p.assignee.group === 'public');

  // Compare each existing assignee against page permissions
  const assigneesMissingPermissions = visibleToSpace
    ? []
    : ((bountyPermissions[target] ?? ([] as { id: string; group: string }[])).filter(
        (bountyPermissionAssignee) =>
          bountyPermissionAssignee.group !== 'public' &&
          !pagePermissions.some((pp) => {
            // Make sure there are no individual user permissions, or roles through which they can see this page
            if (bountyPermissionAssignee.group === 'user') {
              const canSeePageViaRole =
                pp.assignee.group === 'role'
                  ? members.some(
                      (member) =>
                        member.id === bountyPermissionAssignee.id &&
                        member.roles.some((role) => role.id === (pp.assignee as TargetPermissionGroup<'role'>).id)
                    )
                  : false;

              return (
                (pp.assignee.group === 'user' && pp.assignee.id === bountyPermissionAssignee.id) || !!canSeePageViaRole
              );
            } else {
              return pp.assignee.group === 'role' && pp.assignee.id === bountyPermissionAssignee.id;
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
