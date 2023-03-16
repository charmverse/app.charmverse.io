import { useMembers } from 'hooks/useMembers';

import { RoleRowBase } from './RoleRowBase';

export function MemberRoleRow({ readOnly }: { readOnly: boolean }) {
  const { members, removeGuest } = useMembers();

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
      members={members.filter((member) => !member.isAdmin && !member.isGuest)}
      removeMember={removeGuest}
    />
  );
}
