import { baseUrl } from '@packages/testing/mockApiCall';
import request from 'supertest';

describe('GET /api/email-templates - renders email templates', () => {
  it('should return 200', async () => {
    await request(baseUrl).get('/api/email-templates').expect(200);
  });
});
