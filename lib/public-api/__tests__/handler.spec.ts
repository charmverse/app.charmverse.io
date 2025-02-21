import type { ApiEventMap } from '@packages/metrics/mixpanel/interfaces/ApiEvent';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import type { InjectedPageApiKey, NextApiRequestWithApiPageKey } from '@root/lib/middleware/requireApiPageKey';
import type { NextApiRequest } from 'next';
import { v4 as uuid } from 'uuid';

import { logApiRequest } from '../handler';

jest.mock('@packages/metrics/mixpanel/trackUserAction', () => ({
  trackUserAction: jest.fn()
}));

beforeAll(() => {});

/**
 * Next.js takes queries from the URL and the parameters and puts them in the query object ie. /endpoint/{key}/action is the same as /endpoint?key=value and the req.query object will be { key: value }
 */
describe('logApiRequest', () => {
  it('should sanitise the api key sent to analytics tracking service', async () => {
    const baseEndpoint = '/api/v1/endpoint';

    const fakeApiKey = uuid();

    const mockedReq: Partial<NextApiRequest> = {
      url: `${baseEndpoint}?api_key=${fakeApiKey}&randomParam=455`,
      method: 'GET',
      authorizedSpaceId: uuid(),
      query: { api_key: fakeApiKey },
      botUser: {
        id: uuid()
      } as any
    };

    await logApiRequest(mockedReq as any, {} as any, () => null);

    expect(trackUserAction as any).toHaveBeenCalledWith<Parameters<typeof trackUserAction>>('space_api_call', {
      endpoint: baseEndpoint,
      method: mockedReq.method,
      partnerKey: '',
      pageId: '',
      spaceId: mockedReq.authorizedSpaceId,
      userId: mockedReq.botUser?.id
    } as ApiEventMap['space_api_call']);
  });
  // An API Key linked to individual pages and used in a webhook context
  it('should sanitise the api page key sent to analytics tracking service', async () => {
    const baseEndpoint = '/api/v1/endpoint';

    const mockApiPageKeyToken = uuid();
    const mockSpaceId = uuid();

    const mockApiPageKey: InjectedPageApiKey = {
      apiKey: mockApiPageKeyToken,
      createdAt: new Date(),
      createdBy: uuid(),
      page: { spaceId: mockSpaceId },
      pageId: uuid(),
      type: 'typeform',
      updatedAt: new Date()
    };

    const mockedReq: Partial<NextApiRequestWithApiPageKey> = {
      url: `${baseEndpoint}/${mockApiPageKeyToken}`,
      method: 'GET',
      apiPageKey: mockApiPageKey,
      query: { apiPageKey: mockApiPageKeyToken }
    };

    await logApiRequest(mockedReq as any, {} as any, () => null);

    expect(trackUserAction as any).toHaveBeenCalledWith<Parameters<typeof trackUserAction>>('space_api_call', {
      endpoint: `${baseEndpoint}/{apiPageKey}`,
      method: mockedReq.method,
      partnerKey: '',
      pageId: mockApiPageKey.pageId,
      spaceId: mockApiPageKey.page.spaceId,
      userId: ''
    } as ApiEventMap['space_api_call']);
  });
});
