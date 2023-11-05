import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';

import { useMemberDialog } from '../hooks/useMemberDialog';

import { MemberProfile } from './MemberProfile/MemberProfile';

export function MemberProfileDialogGlobal() {
  const { hideUserProfile, memberId } = useMemberDialog();
  const { space } = useCurrentSpace();
  const { getMemberById } = useMembers();
  const member = memberId ? getMemberById(memberId) : null;
  const { user } = useUser();

  // Wait for user to load before deciding what to show
  if (!user) {
    return null;
  }

  // Show the selected member profile
  if (member) {
    return (
      <MemberProfile
        isMine={member.id === user.id}
        key={user.id}
        member={member}
        space={space}
        onClose={hideUserProfile}
      />
    );
  }

  return null;
}
