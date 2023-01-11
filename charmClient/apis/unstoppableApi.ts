import type { ProfileItem } from '@prisma/client';

import * as http from 'adapters/http';
import type { LoggedInUser } from 'models';
import type { UnstoppableDomainsLoginRequest } from 'pages/api/unstoppable-domains/login';

export interface UpdateProfileItemRequest {
  profileItems: Omit<ProfileItem, 'userId'>[];
}

export class UnstoppableDomainsApi {
  login(login: UnstoppableDomainsLoginRequest) {
    return http.POST<LoggedInUser>('/api/unstoppable-domains/login', login);
  }
}
