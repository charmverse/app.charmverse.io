import { useMemberProfile } from './hooks/useMemberProfile';
import { MemberDialog } from './MemberDialog';

// a wrapper of page dialog that uses usePageDialogHook
export function MemberDialogGlobal() {
  const { hideMemberProfile, memberId } = useMemberProfile();

  return memberId ? <MemberDialog memberId={memberId} onClose={hideMemberProfile} /> : null;
}
