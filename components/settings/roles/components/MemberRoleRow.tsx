import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useMembers } from 'hooks/useMembers';

import { RolePermissions } from './RolePermissions/RolePermissions';
import { RoleRowBase } from './RoleRowBase';

export function MemberRoleRow({ readOnly, spaceId }: { readOnly: boolean; spaceId: string }) {
  const { members, makeMember } = useMembers();
  const { isFreeSpace } = useIsFreeSpace();

  const assignedMembers = members.filter(
    (member) =>
      !member.isBot &&
      !member.isAdmin &&
      // Ignore guest status for free spaces
      (isFreeSpace ? true : !member.isGuest)
  );
  // there must always be at least one admin
  const includeAdmins = members.filter((member) => !member.isBot && member.isAdmin).length > 1;
  const eligibleMembers = members.filter(
    (member) => !member.isBot && ((includeAdmins && member.isAdmin) || member.isGuest)
  );

  return (
    <RoleRowBase
      title='Default'
      description={
        <>
          Users are automatically added to the Default Role
          <br />
          Admins can change the permissions for the Default and Custom roles
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
