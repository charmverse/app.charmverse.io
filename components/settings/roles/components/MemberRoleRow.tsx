import { useMembers } from 'hooks/useMembers';

import { RolePermissions } from './RolePermissions/RolePermissions';
import { RoleRowBase } from './RoleRowBase';

export function MemberRoleRow({ readOnly, spaceId }: { readOnly: boolean; spaceId: string }) {
  const { members } = useMembers();

  return (
    <RoleRowBase
      title='Member'
      description={
        <>
          Users are added to the Member Role by default
          <br />
          Admins can change the default permissions for the Member Role
        </>
      }
      readOnlyMembers={readOnly}
      members={members.filter((member) => !member.isBot && !member.isAdmin && !member.isGuest)}
      permissions={<RolePermissions targetGroup='space' id={spaceId} />}
    />
  );
}
