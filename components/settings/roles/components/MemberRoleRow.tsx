import { useMembers } from 'hooks/useMembers';

import { RolePermissions } from './RolePermissions/RolePermissions';
import { RoleRowBase } from './RoleRowBase';

export function MemberRoleRow({ readOnly, spaceId }: { readOnly: boolean; spaceId: string }) {
  const { members, makeMember } = useMembers();

  const assignedMembers = members.filter((member) => !member.isBot && !member.isAdmin && !member.isGuest);
  // there must always be at least one admin
  const includeAdmins = members.filter((member) => !member.isBot && member.isAdmin).length > 1;
  const eligibleMembers = members.filter(
    (member) => !member.isBot && ((includeAdmins && member.isAdmin) || member.isGuest)
  );

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
      members={assignedMembers}
      eligibleMembers={eligibleMembers}
      permissions={<RolePermissions targetGroup='space' id={spaceId} />}
      onAddMembers={!readOnly ? makeMember : undefined}
    />
  );
}
