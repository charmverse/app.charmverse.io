import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';
import Snackbar from 'components/common/Snackbar';
import { MemberOnboardingModal } from 'components/members/MemberOnboardingModal';

import useDatadogLogger from './hooks/useDatadogLogger';

export default function GlobalComponents () {
  // Register logs to Datadog
  useDatadogLogger();

  return (
    <>
      <HexagonalAvatarMask id='hexagon-avatar' />
      <MemberOnboardingModal />
      <Snackbar />
    </>
  );
}
