import * as http from '@packages/adapters/http';

export class TokenGateApi {
  archiveTokenGate(tokenGateId: string) {
    return http.PUT(`/api/token-gates/${tokenGateId}/archive`);
  }

  unarchiveTokenGate(tokenGateId: string) {
    return http.PUT(`/api/token-gates/${tokenGateId}/unarchive`);
  }
}
