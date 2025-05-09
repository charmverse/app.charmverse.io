import SafeApiKit from '@safe-global/api-kit';

import { getSafeApiClient } from '../getSafeApiClient';

describe('getSafeApiClient', () => {
  it('returns a client', async () => {
    const client = await getSafeApiClient({ chainId: 1 });
    expect(client).toBeInstanceOf(SafeApiKit);
  });
});
