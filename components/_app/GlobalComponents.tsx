import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';
import Snackbar from 'components/common/Snackbar';
import { MemberPropertiesOnBoardingModal } from 'components/members/MemberPropertiesOnBoardingModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useOnboarding } from 'hooks/useOnboarding';

export default function GlobalComponents () {
  const { onboarding } = useOnboarding();
  const [space] = useCurrentSpace();
  return (
    <>
      <HexagonalAvatarMask id='hexagon-avatar' />
      {space && onboarding[space.id] && <MemberPropertiesOnBoardingModal />}
      <Snackbar />
    </>
  );
}
