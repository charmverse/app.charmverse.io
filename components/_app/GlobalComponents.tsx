import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';
import Snackbar from 'components/common/Snackbar';
import SetAvatarPopup from 'components/profile/components/SetAvatarPopup/SetAvatarPopup';

export default function GlobalComponents () {
  return (
    <>
      <HexagonalAvatarMask id='hexagon-avatar' />
      <SetAvatarPopup />
      <Snackbar />
    </>
  );
}
