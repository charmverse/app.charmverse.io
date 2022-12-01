import type { Space, User } from '@prisma/client';

import * as http from 'adapters/http';
import type { CheckDiscordGateResult } from 'lib/discord/interface';
import type { ConnectDiscordPayload, ConnectDiscordResponse } from 'pages/api/discord/connect';
import type { ImportDiscordRolesPayload, ImportRolesResponse } from 'pages/api/discord/importRoles';

export class DiscordApi {
  disconnectDiscord() {
    return http.POST<User>('/api/discord/disconnect');
  }

  connectDiscord(payload: ConnectDiscordPayload) {
    return http.POST<ConnectDiscordResponse>('/api/discord/connect', payload);
  }

  importRolesFromDiscordServer(payload: ImportDiscordRolesPayload) {
    return http.POST<ImportRolesResponse>('/api/discord/importRoles', payload);
  }

  checkDiscordGate(spaceDomain: string) {
    return http.GET<CheckDiscordGateResult>(`/api/discord/gate?spaceDomain=${spaceDomain}`);
  }

  verifyDiscordGate(spaceId: string) {
    return http.POST<Space>('/api/discord/gate/verify', { spaceId });
  }
}
