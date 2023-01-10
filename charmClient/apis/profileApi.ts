import type { ProfileItem } from '@prisma/client';

import * as http from 'adapters/http';
import type { UnstoppableDomainsLoginRequest } from 'lib/blockchain/unstoppableDomains/loginWithUnstoppableDomain';
import type { ConnectGoogleAccountRequest } from 'lib/google/connectGoogleAccount';
import type { DisconnectGoogleAccountRequest } from 'lib/google/disconnectGoogleAccount';
import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import type { UserAvatar } from 'lib/users/interfaces';
import type { LoggedInUser } from 'models';

export interface UpdateProfileItemRequest {
  profileItems: Omit<ProfileItem, 'userId'>[];
}

export class ProfileApi {
  setAvatar(data: UserAvatar) {
    return http.PUT<LoggedInUser>('/api/profile/avatar', data);
  }

  updateProfileItem(data: UpdateProfileItemRequest) {
    return http.PUT('/api/profile/items', data);
  }

  loginWithUnstoppableDomains(login: UnstoppableDomainsLoginRequest) {
    return http.POST<LoggedInUser>('/api/unstoppable-domains/login', login);
  }

  loginWithGoogle(login: LoginWithGoogleRequest) {
    return http.POST<LoggedInUser>('/api/google/login', login);
  }

  connectGoogleAccount(data: Omit<ConnectGoogleAccountRequest, 'userId'>) {
    return http.POST<LoggedInUser>('/api/google/connect-account', data);
  }

  disconnectGoogleAccount(data: Omit<DisconnectGoogleAccountRequest, 'userId'>) {
    return http.POST<LoggedInUser>('/api/google/disconnect-account', data);
  }
}
