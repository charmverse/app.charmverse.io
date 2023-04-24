import type { ProfileItem } from '@charmverse/core/dist/prisma';

import * as http from 'adapters/http';
import type { UnstoppableDomainsLoginRequest } from 'lib/blockchain/unstoppableDomains/loginWithUnstoppableDomain';
import type { LoggedInUser } from 'models';

export interface UpdateProfileItemRequest {
  profileItems: Omit<ProfileItem, 'userId'>[];
}

export class UnstoppableDomainsApi {
  login(login: UnstoppableDomainsLoginRequest) {
    return http.POST<LoggedInUser>('/api/unstoppable-domains/login', login);
  }
}
