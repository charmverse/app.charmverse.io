import { PaidAnnouncementBanner } from 'components/common/Banners/PaidAnnouncementBanner';
import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';
import Snackbar from 'components/common/Snackbar';
import { UserProfileDialogGlobal } from 'components/common/UserProfile/UserProfileDialogGlobal';
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
      <UserProfileDialogGlobal />
      <Snackbar />
    </>
  );
}
