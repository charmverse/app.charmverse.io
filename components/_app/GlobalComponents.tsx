import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';
import Snackbar from 'components/common/Snackbar';
import { MemberOnboardingModal } from 'components/members/MemberOnboardingModal';

export default function GlobalComponents () {

  return (
    <>
      <HexagonalAvatarMask id='hexagon-avatar' />
      <MemberOnboardingModal />
      <Snackbar />
    </>
  );
}
