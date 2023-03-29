import type * as litSDK from '@lit-protocol/lit-node-client';

type LitResponse = Awaited<ReturnType<typeof litSDK.verifyJwt>>;

export function verifiedJWTResponse(
  response: Partial<Omit<LitResponse, 'payload'> & { payload: Partial<LitResponse['payload']> }>
): LitResponse {
  return {
    header: {},
    verified: true,
    signature: new Uint8Array(),
    ...response,
    payload: {
      iss: 'LIT',
      sub: 'user',
      chain: 'ethereum',
      iat: 1,
      exp: 1,
      baseUrl: 'https://app.charmverse.io',
      path: '',
      orgId: '',
      role: 'member',
      extraData: `{ "tokenGateId": "id" }`,
      ...(response.payload || {})
    }
  };
}
