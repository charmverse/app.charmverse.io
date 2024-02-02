import type { ImportDiscordRolesPayload, ImportRolesResponse } from 'pages/api/discord/importRoles';

import { usePOST } from './helpers';

export function useImportDiscordRolesFromServer() {
  return usePOST<ImportDiscordRolesPayload, ImportRolesResponse>('/api/discord/importRoles');
}
