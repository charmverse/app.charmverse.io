import { useMembers } from 'hooks/useMembers';

import { RoleRowBase } from './RoleRowBase';

export function AdminRoleRow({ readOnly }: { readOnly: boolean }) {
  const { members, makeAdmin } = useMembers();

  const assignedMembers = members.filter((member) => !member.isBot && member.isAdmin);
  const eligibleMembers = members.filter((member) => !member.isBot && !member.isAdmin && !member.isGuest);

  return (
    <RoleRowBase
      title='Admin'
      description={
        <>
          Admin permissions can not be changed
          <br />
          Admins can view and delete everything in the space
        </>
      }
      readOnlyMembers={readOnly}
      members={assignedMembers}
      eligibleMembers={eligibleMembers}
      onAddMembers={!readOnly ? makeAdmin : undefined}
    />
  );
}
