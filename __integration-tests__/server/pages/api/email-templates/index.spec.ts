
import request from 'supertest';

import { baseUrl } from 'testing/mockApiCall';

describe('GET /api/email-templates - renders email templates', () => {

  it('should return 200', async () => {
    await request(baseUrl)
      .get('/api/email-templates')
      .expect(200);

  });

});
