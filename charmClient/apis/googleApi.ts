import type { ProfileItem } from '@charmverse/core/prisma';
import * as http from '@root/adapters/http';
import type { LoggedInUser } from '@root/lib/profile/getUser';

import type { DisconnectGoogleAccountRequest } from 'lib/google/disconnectGoogleAccount';
import type { EmailAccountDisconnect } from 'lib/google/disconnectVerifiedEmail';
import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import type { CreateCredentialRequest, CredentialRequest, CredentialItem } from 'pages/api/google/credentials';
import type { GoogleFormItem, GetFormsRequest } from 'pages/api/google/forms';
import type { RefreshFormsRequest } from 'pages/api/google/forms/sync-responses';

export interface UpdateProfileItemRequest {
  profileItems: Omit<ProfileItem, 'userId'>[];
}

export class GoogleApi {
  loginWithCode({ code, type, redirectUri }: { code: string; type?: 'login' | 'connect'; redirectUri?: string }) {
    return http.POST<LoggedInUser | { otpRequired: true }>('/api/google/code', {
      code,
      type: type || 'login',
      redirectUri
    });
  }

  disconnectAccount(params: Omit<DisconnectGoogleAccountRequest, 'userId'>) {
    return http.POST<LoggedInUser>('/api/google/disconnect-account', params);
  }

  authenticateMagicLink(data: Pick<LoginWithGoogleRequest, 'accessToken'>) {
    return http.POST<LoggedInUser | { otpRequired: true }>('/api/google/verify-magic-link', data);
  }

  connectEmailAccount(data: Pick<LoginWithGoogleRequest, 'accessToken'>) {
    return http.POST<LoggedInUser>('/api/google/connect-email-account', data);
  }

  disconnectEmailAccount(data: Pick<EmailAccountDisconnect, 'email'>) {
    return http.POST<LoggedInUser>('/api/google/disconnect-email-account', data);
  }

  forms = {
    getCredentials() {
      return http.GET<CredentialItem[]>('/api/google/credentials');
    },
    getForms(params: GetFormsRequest) {
      return http.GET<GoogleFormItem[]>('/api/google/forms', params);
    },
    syncFormResponses(params: RefreshFormsRequest) {
      return http.POST('/api/google/forms/sync-responses', params);
    },
    deleteCredential() {
      return http.DELETE<CredentialRequest[]>('/api/google/credentials');
    },
    createCredential(credential: CreateCredentialRequest) {
      return http.POST<CredentialItem>('/api/google/credentials', credential);
    }
  };
}
