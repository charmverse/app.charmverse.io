import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';
import Snackbar from 'components/common/Snackbar';
import { MemberPropertiesOnBoardingModal } from 'components/members/MemberPropertiesOnBoardingModal';

export default function GlobalComponents () {

  return (
    <>
      <HexagonalAvatarMask id='hexagon-avatar' />
      <MemberPropertiesOnBoardingModal />
      <Snackbar />
    </>
  );
}
