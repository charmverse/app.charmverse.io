import { useMembers } from 'hooks/useMembers';

import { RoleRowBase } from './RoleRowBase';

export function GuestRoleRow({ readOnly }: { readOnly: boolean }) {
  const { guests } = useMembers();

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
      eligibleMembers={[]}
    />
  );
}
