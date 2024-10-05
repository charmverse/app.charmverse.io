import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../../tasks/processBuilderActivity/getBuilderActivity', () => ({
  getBuilderActivity: jest.fn()
}));

const worker = await import('../../worker');
const { getBuilderActivity } = await import('../../tasks/processBuilderActivity/getBuilderActivity');

describe('Worker integration: processPullRequests', () => {
  it('Responds with 200 when there is nothing to do', async () => {
    (getBuilderActivity as jest.Mock<typeof getBuilderActivity>).mockResolvedValue({ commits: [], pullRequests: [] });

    await request(worker.default.callback()).post('/process-builder-activity').expect(200);
  });
});
