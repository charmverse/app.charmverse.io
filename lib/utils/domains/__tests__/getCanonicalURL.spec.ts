import httpMocks from 'node-mocks-http';

import { getCanonicalURL } from '../getCanonicalURL';

describe('getCanonicalURL', () => {
  it('should return canonical for space without custom domain', () => {
    const mockRequest = httpMocks.createRequest({
      headers: {
        host: 'app.charmverse.io'
      }
    });
    const result = getCanonicalURL({
      req: mockRequest,
      spaceDomain: 'foobar',
      spaceCustomDomain: null,
      path: 'getting-started'
    });
    expect(result).toEqual('https://app.charmverse.io/foobar/getting-started');
  });

  it('should return canonical for space with custom domain', () => {
    const mockRequest = httpMocks.createRequest({
      headers: {
        host: 'app.charmverse.io'
      }
    });
    const result = getCanonicalURL({
      req: mockRequest,
      spaceDomain: 'foobar',
      spaceCustomDomain: 'work.charmverse.fyi',
      path: 'getting-started'
    });
    expect(result).toEqual('https://work.charmverse.fyi/getting-started');
  });
});
