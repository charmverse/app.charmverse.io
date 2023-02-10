import { useMemberProfile } from 'components/profile/hooks/useMemberProfile';

import { MemberMiniProfile } from './MemberMiniProfile';

// a wrapper of page dialog that uses usePageDialogHook
export default function MemberProfileGlobal() {
  const { hideMemberProfile, memberId } = useMemberProfile();

  return memberId ? <MemberMiniProfile memberId={memberId} onClose={hideMemberProfile} /> : null;
}
