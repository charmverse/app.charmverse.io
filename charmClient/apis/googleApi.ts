import type { ProfileItem } from '@prisma/client';

import * as http from 'adapters/http';
import type { ConnectGoogleAccountRequest } from 'lib/google/connectGoogleAccount';
import type { DisconnectGoogleAccountRequest } from 'lib/google/disconnectGoogleAccount';
import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import type { LoggedInUser } from 'models';

export interface UpdateProfileItemRequest {
  profileItems: Omit<ProfileItem, 'userId'>[];
}

export class GoogleApi {
  login(login: LoginWithGoogleRequest) {
    return http.POST<LoggedInUser>('/api/google/login', login);
  }

  connectAccount(data: Omit<ConnectGoogleAccountRequest, 'userId'>) {
    return http.POST<LoggedInUser>('/api/google/connect-account', data);
  }

  disconnectAccount(data: Omit<DisconnectGoogleAccountRequest, 'userId'>) {
    return http.POST<LoggedInUser>('/api/google/disconnect-account', data);
  }
}
