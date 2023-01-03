import type { ProfileItem } from '@prisma/client';

import * as http from 'adapters/http';
import type { ConnectGoogleAccountRequest } from 'lib/google/connectGoogleAccount';
import type { DisconnectGoogleAccountRequest } from 'lib/google/disconnectGoogleAccount';
import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import type { LoggedInUser } from 'models';
import type { GetFormsRequest } from 'pages/api/google/forms';
import type { CreateCredentialRequest, CredentialRequest, CredentialItem } from 'pages/api/google/forms/credentials';

export interface UpdateProfileItemRequest {
  profileItems: Omit<ProfileItem, 'userId'>[];
}

export class GoogleApi {
  login(login: LoginWithGoogleRequest) {
    return http.POST<LoggedInUser>('/api/google/login', login);
  }

  connectAccount(params: Omit<ConnectGoogleAccountRequest, 'userId'>) {
    return http.POST<LoggedInUser>('/api/google/connect-account', params);
  }

  disconnectAccount(params: Omit<DisconnectGoogleAccountRequest, 'userId'>) {
    return http.POST<LoggedInUser>('/api/google/disconnect-account', params);
  }

  forms = {
    getCredentials() {
      return http.GET<CredentialItem[]>('/api/google/forms/credentials');
    },
    getForms(params: GetFormsRequest) {
      return http.GET<CredentialItem[]>('/api/google/forms', params);
    },
    deleteCredential() {
      return http.DELETE<CredentialRequest[]>('/api/google/forms/credentials');
    },
    createCredential(credential: CreateCredentialRequest) {
      return http.POST('/api/google/forms/credentials', credential);
    }
  };
}
