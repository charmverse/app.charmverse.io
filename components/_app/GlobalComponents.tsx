import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';
import { MemberDialogGlobal } from 'components/common/MemberProfile/MemberDialogGlobal';
import { MemberDialogOnboarding } from 'components/common/MemberProfile/MemberDialogOnboarding';
import Snackbar from 'components/common/Snackbar';
import { useImportDiscordRoles } from 'components/settings/roles/hooks/useImportDiscordRoles';

import useDatadogLogger from './hooks/useDatadogLogger';

export function GlobalComponents() {
  // Register logs to Datadog
  useDatadogLogger();

  // Trigger discord role import on redirect since modal won't be open
  useImportDiscordRoles();

  return (
    <>
      <HexagonalAvatarMask id='hexagon-avatar' />
      <MemberDialogOnboarding />
      <MemberDialogGlobal />
      <Snackbar />
    </>
  );
}
