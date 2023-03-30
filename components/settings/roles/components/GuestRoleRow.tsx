import { useMembers } from 'hooks/useMembers';

import { RoleRowBase } from './RoleRowBase';

export function GuestRoleRow({ readOnly }: { readOnly: boolean }) {
  const { guests, members, makeGuest } = useMembers();

  // there must always be at least one admin
  const includeAdmins = members.filter((member) => !member.isBot && member.isAdmin).length > 1;
  const eligibleMembers = members.filter(
    (member) => !member.isBot && (includeAdmins || !member.isAdmin) && !member.isGuest
  );
  return (
    <RoleRowBase
      title='Guest'
      description={
        <>
          Guest permissions can not be changed
          <br />
          Guests only have access to Pages, Bounties, Proposals and Forum Posts they have been shared on
        </>
      }
      readOnlyMembers={readOnly}
      members={guests}
      eligibleMembers={eligibleMembers}
      onAddMembers={!readOnly ? makeGuest : undefined}
    />
  );
}
