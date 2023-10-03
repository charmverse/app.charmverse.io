import { getAppApexDomain } from 'lib/utilities/domains/getAppApexDomain';

import { getPagePath } from '../getPagePath';

describe('getPagePath', () => {
  it('should add space domain when on localhost', () => {
    const result = getPagePath({
      spaceDomain: 'foobar',
      path: 'members',
      hostName: 'http://localhost:3000'
    });
    expect(result).toEqual('/foobar/members');
  });

  it('should add space domain when on a CharmVerse-hosted domain', () => {
    const result = getPagePath({
      spaceDomain: 'foobar',
      path: 'members',
      hostName: `app.${getAppApexDomain()}`
    });
    expect(result).toEqual('/foobar/members');
  });

  it('should not include space domain when on a subdomain of CharmVerse domain', () => {
    const result = getPagePath({
      spaceDomain: 'foobar',
      path: 'members',
      hostName: `foobar.${getAppApexDomain()}`
    });
    expect(result).toEqual('/members');
  });

  it('should not include space domain when on a custom host domain', () => {
    const result = getPagePath({
      spaceDomain: 'foobar',
      path: 'members',
      hostName: 'foobar.com'
    });
    expect(result).toEqual('/members');
  });
});
