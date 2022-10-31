import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import type { BountyPermissionLevel } from '@prisma/client';

import { useMembers } from 'hooks/useMembers';
import useRoles from 'hooks/useRoles';
import type { BountyPermissions } from 'lib/bounties';
import type { PagePermissionMeta, TargetPermissionGroup } from 'lib/permissions/interfaces';
import { isTruthy } from 'lib/utilities/types';

interface Props {
  bountyPermissions: Partial<BountyPermissions>;
  pagePermissions: PagePermissionMeta[];
  target: Extract<BountyPermissionLevel, 'reviewer' | 'submitter'>;
}

export default function MissingPagePermissions ({ bountyPermissions, pagePermissions, target }: Props) {

  const { roleups } = useRoles();
  const { members } = useMembers();

  const visibleToSpace = pagePermissions.some(p => (isTruthy(p.spaceId) || p.public === true));

  // Compare each existing assignee against page permissions
  const assigneesMissingPermissions = visibleToSpace ? [] : (bountyPermissions[target] ?? []).filter(bountyPermissionAssignee => bountyPermissionAssignee.group !== 'public' && !pagePermissions.some(pp => {
    // Make sure there are no individual user permissions, or roles through which they can see this page
    if (bountyPermissionAssignee.group === 'user') {

      const canSeePageViaRole = pp.roleId ? roleups?.find(r => r.id === pp.roleId)?.users.find(u => u.id === bountyPermissionAssignee.id) : false;

      return pp.userId === bountyPermissionAssignee.id || !!canSeePageViaRole;
    }
    else {
      return pp.roleId === bountyPermissionAssignee.id;
    }
  }));

  if (assigneesMissingPermissions.length === 0) {
    return null;
  }

  const missingPermissionsWithName: (TargetPermissionGroup & { name: string })[] = assigneesMissingPermissions.map(assignee => {
    return {
      ...assignee,
      name: (assignee.group === 'user' ? members.find(c => c.id === assignee.id)?.username : roleups?.find(r => r.id === assignee.id)?.name) as string
    };
  });

  const componentLabel = target === 'reviewer' ? 'Reviewers' : 'Submitters';

  return (
    <Alert severity='warning'>
      {
        missingPermissionsWithName.map(bountyPermissionAssignee => (

          <Typography variant='caption' display='flex' sx={{ alignItems: 'center' }}>
            {bountyPermissionAssignee.group === 'space' ? 'Workspace members' : bountyPermissionAssignee.group === 'role' ? `${bountyPermissionAssignee.name} role` : `${bountyPermissionAssignee.name}`} cannot view this page
          </Typography>

        ))
      }
    </Alert>
  );

}
