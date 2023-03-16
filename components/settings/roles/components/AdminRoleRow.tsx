import { useMembers } from 'hooks/useMembers';

import { RoleRowBase } from './RoleRowBase';

export function AdminRoleRow({ readOnly }: { readOnly: boolean }) {
  const { members, removeGuest } = useMembers();

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
      members={members.filter((member) => member.isAdmin)}
      removeMember={removeGuest}
    />
  );
}
