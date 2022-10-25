import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';
import Snackbar from 'components/common/Snackbar';
import { MemberPropertiesOnBoardingModal } from 'components/members/MemberPropertiesOnBoardingModal';
import { useOnboarding } from 'hooks/useOnboarding';

export default function GlobalComponents () {
  const { onboarding } = useOnboarding();
  return (
    <>
      <HexagonalAvatarMask id='hexagon-avatar' />
      {onboarding && <MemberPropertiesOnBoardingModal />}
      <Snackbar />
    </>
  );
}
