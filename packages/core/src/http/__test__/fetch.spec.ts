import { MockAgent, setGlobalDispatcher } from 'undici';

import fetch from '../fetch';

const DUMMY_BASE_URL = 'http://127.0.0.1:5984';
const mockAgent = new MockAgent();
const mockPool = mockAgent.get(DUMMY_BASE_URL);
setGlobalDispatcher(mockAgent);
mockAgent.disableNetConnect();

const responseOptions = {
  headers: {
    'content-type': 'application/json'
  }
};

describe('Http retry client tests', () => {
  afterAll(async () => {
    await mockPool.close();
  });

  it('Should retry on 5xx', async () => {
    mockPool.intercept({ path: '/' }).reply(500);
    mockPool.intercept({ path: '/' }).reply(200, { success: true }, responseOptions);

    const request = fetch(DUMMY_BASE_URL);
    await expect(request).resolves.toEqual({ success: true });
  });

  it('Should not retry when retries = 0', async () => {
    mockPool.intercept({ path: '/' }).reply(500);

    const request = fetch(DUMMY_BASE_URL, { retries: 0 });

    await expect(request).rejects.toEqual(expect.objectContaining({ status: 500 }));
  });

  it('Should not retry 2xx', async () => {
    mockPool.intercept({ path: '/' }).reply(200, { success: true }, responseOptions);

    const request = fetch(DUMMY_BASE_URL, { retries: 5 });
    await expect(request).resolves.toEqual({ success: true });
  });

  it('Should not retry 4xx', async () => {
    mockPool.intercept({ path: '/' }).reply(400);

    const request = fetch(DUMMY_BASE_URL, { retries: 5 });
    await expect(request).rejects.toEqual(expect.objectContaining({ status: 400 }));
  });

  it('Should not retry 504 (timeout)', async () => {
    mockPool.intercept({ path: '/' }).reply(504);
    mockPool.intercept({ path: '/' }).reply(200);

    const request = fetch(DUMMY_BASE_URL, { retries: 5 });

    await expect(request).rejects.toEqual(expect.objectContaining({ status: 504 }));
  });
});
