import request from 'supertest';

import { ironOptions } from 'lib/session/config';
import { baseUrl } from 'testing/mockApiCall';

// These API calls should succeed without needed a user account
describe('POST /api/session/logout - Log out user', () => {
  it('should respond 200', async () => {

    const r = await request(baseUrl)
      .post('/api/session/logout')
      .expect(200);

    const cookies = r.get('Set-Cookie');
    expect(cookies.length).toBe(1);
    expect(cookies[0]).toContain(`${ironOptions.cookieName}=;`);
  });

});
