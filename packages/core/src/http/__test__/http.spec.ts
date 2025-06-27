import { MockAgent, setGlobalDispatcher } from 'undici';

import { DELETE, GET } from '../index';

const baseUrl = 'https://example.com';
const agent = new MockAgent();
const mockPool = agent.get(baseUrl);
setGlobalDispatcher(agent);
agent.disableNetConnect();

// some fake headers for testing
const headers = { 'x-custom-header': 'custom' };

describe('Http client methods', () => {
  afterAll(async () => {
    await mockPool.close();
  });

  describe('GET', () => {
    it('Should include array values in the query by default', async () => {
      mockPool.intercept({ method: 'GET', path: '/?ids[]=1&ids[]=2&ids[]=3' }).reply(200);
      await GET(baseUrl, { ids: [1, 2, 3] });
      agent.assertNoPendingInterceptors();
    });

    it('Should not include brackets for an array', async () => {
      mockPool.intercept({ method: 'GET', path: '/?ids=1&ids=2&ids=3' }).reply(200);
      await GET(baseUrl, { ids: [1, 2, 3] }, { addBracketsToArrayValues: false });
      agent.assertNoPendingInterceptors();
    });

    it('Should call an endpoint with no query params', async () => {
      mockPool.intercept({ method: 'GET', path: '/' }).reply(200);
      await GET(baseUrl);
      agent.assertNoPendingInterceptors();
    });

    it('Should call an endpoint with query params', async () => {
      mockPool.intercept({ method: 'GET', path: '/?jack=sprat' }).reply(200);
      await GET(baseUrl, { jack: 'sprat' });
      agent.assertNoPendingInterceptors();
    });

    it('Should call an endpoint with query params and config', async () => {
      mockPool.intercept({ method: 'GET', path: '/?jack=sprat', headers }).reply(200);
      await GET(baseUrl, { jack: 'sprat' }, { headers });
      agent.assertNoPendingInterceptors();
    });

    it('Should call an endpoint with no query params and config', async () => {
      mockPool.intercept({ method: 'GET', path: '/', headers }).reply(200);
      await GET(baseUrl, null, { headers });
      agent.assertNoPendingInterceptors();
    });

    it('Should call an endpoint with config only', async () => {
      mockPool.intercept({ method: 'GET', path: '/', headers }).reply(200);
      await GET(baseUrl, { headers });
      agent.assertNoPendingInterceptors();
    });
  });

  describe('DELETE', () => {
    it('Should call an endpoint with no query params', async () => {
      mockPool.intercept({ method: 'DELETE', path: '/' }).reply(200);
      await DELETE(baseUrl);
      agent.assertNoPendingInterceptors();
    });

    it('Should call an endpoint with query params', async () => {
      mockPool.intercept({ method: 'DELETE', path: '/?jack=sprat' }).reply(200);
      await DELETE(baseUrl, { jack: 'sprat' });
      agent.assertNoPendingInterceptors();
    });

    it('Should call an endpoint with query params and config', async () => {
      mockPool.intercept({ method: 'DELETE', path: '/?jack=sprat', headers }).reply(200);
      await DELETE(baseUrl, { jack: 'sprat' }, { headers });
      agent.assertNoPendingInterceptors();
    });

    it('Should call an endpoint with config only', async () => {
      mockPool.intercept({ method: 'DELETE', path: '/', headers }).reply(200);
      await DELETE(baseUrl, { headers });
      agent.assertNoPendingInterceptors();
    });
  });
});
