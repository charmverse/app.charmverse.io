import type { AuthSig } from '@lit-protocol/types';

import * as http from 'adapters/http';

export class TokenGatesApi {
  reevaluateRoles(verification: { authSig: AuthSig; spaceId: string; userId: string }): Promise<string[]> {
    return http.POST('/api/token-gates/reevaluate', verification);
  }
}
