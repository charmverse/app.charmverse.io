import type { Space, User } from '@charmverse/core/prisma';
import type { LoggedInUser } from '@packages/profile/getUser';
import * as http from '@packages/adapters/http';

import type { CheckDiscordGateResult } from '@packages/lib/discord/interface';
import type { OauthFlowType } from '@packages/lib/oauth/interfaces';
import type { ConnectDiscordPayload, ConnectDiscordResponse } from 'pages/api/discord/connect';

export class DiscordApi {
  disconnectDiscord() {
    return http.POST<User>('/api/discord/disconnect');
  }

  connectDiscord(payload: ConnectDiscordPayload, authFlowType?: OauthFlowType) {
    const query = authFlowType ? `?authFlowType=${authFlowType}` : '';

    return http.POST<ConnectDiscordResponse>(`/api/discord/connect${query}`, payload);
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
