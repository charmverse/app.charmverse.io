import type { ImportDiscordRolesPayload, ImportRolesResponse } from 'pages/api/discord/import-roles';

import { usePOST } from './helpers';

export function useImportDiscordRolesFromServer() {
  return usePOST<ImportDiscordRolesPayload, ImportRolesResponse>('/api/discord/import-roles');
}
