import request from 'supertest';

const worker = await import('../../worker');

describe('Worker integration: processGemsPayout', () => {
  it('Responds with 200 when there is nothing to do', async () => {
    await request(worker.default.callback()).post('/process-gems-payout').expect(200);
  });
});
