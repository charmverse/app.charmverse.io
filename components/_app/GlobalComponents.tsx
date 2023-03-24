import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';
import Snackbar from 'components/common/Snackbar';
import { MemberOnboardingModal } from 'components/members/MemberOnboardingModal';
import MemberProfileGlobal from 'components/profile/components/MemberMiniProfile/MemberProfileGlobal';
import { useImportDiscordRoles } from 'components/settings/roles/hooks/useImportDiscordRoles';

import useDatadogLogger from './hooks/useDatadogLogger';

export default function GlobalComponents() {
  // Register logs to Datadog
  useDatadogLogger();

  // Trigger discord role import on redirect since modal won't be open
  useImportDiscordRoles();

  return (
    <>
      <HexagonalAvatarMask id='hexagon-avatar' />
      <MemberOnboardingModal />
      <MemberProfileGlobal />
      <Snackbar />
    </>
  );
}
