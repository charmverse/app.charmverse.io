import request from 'supertest';

import worker from '../../worker';

describe('Worker integration: processPullRequests', () => {
  it('Responds with 200 when there is nothing to do', async () => {
    await request(worker.callback()).post('/process-pull-requests').expect(200);
  });
});
