import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../../tasks/processPullRequests/getPullRequests', () => ({
  getPullRequests: jest.fn()
}));

const worker = await import('../../worker');
const { getPullRequests } = await import('../../tasks/processPullRequests/getPullRequests');

describe('Worker integration: processPullRequests', () => {
  it('Responds with 200 when there is nothing to do', async () => {
    (getPullRequests as jest.Mock<typeof getPullRequests>).mockResolvedValue([]);

    await request(worker.default.callback()).post('/process-pull-requests').expect(200);
  });
});
