import type { Space, User } from '@charmverse/core/prisma';

import * as http from 'adapters/http';
import type { CheckDiscordGateResult } from 'lib/discord/interface';
import type { OauthFlowType } from 'lib/oauth/interfaces';
import type { LoggedInUser } from 'models';
import type { ConnectDiscordPayload, ConnectDiscordResponse } from 'pages/api/discord/connect';
import type { ImportDiscordRolesPayload, ImportRolesResponse } from 'pages/api/discord/importRoles';

export class DiscordApi {
  disconnectDiscord() {
    return http.POST<User>('/api/discord/disconnect');
  }

  connectDiscord(payload: ConnectDiscordPayload, authFlowType?: OauthFlowType) {
    const query = authFlowType ? `?authFlowType=${authFlowType}` : '';

    return http.POST<ConnectDiscordResponse>(`/api/discord/connect${query}`, payload);
  }

  importRolesFromDiscordServer(payload: ImportDiscordRolesPayload) {
    return http.POST<ImportRolesResponse>('/api/discord/importRoles', payload);
  }

  checkDiscordGate(spaceDomain: string) {
    return http.GET<CheckDiscordGateResult>(`/api/discord/gate?spaceDomain=${spaceDomain}`);
  }

  verifyDiscordGate(body: { joinType?: string; spaceId: string }) {
    return http.POST<Space>('/api/discord/gate/verify', body);
  }

  loginWithDiscordCode(code: string) {
    return http.POST<LoggedInUser | { otpRequired: true }>(`/api/discord/login`, { code });
  }
}
