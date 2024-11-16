import { TWITTER_URL_REGEX } from '../useRequiredMemberProperties';

describe('useRequiredMemberProperties', () => {
  test('should include x.com to xprofile check', () => {
    const xProfile = 'https://x.com/me';
    const twitterProfile = 'https://x.com/me';
    const noGood = 'https://nogood.com/me';
    expect(''.match(TWITTER_URL_REGEX)!.length >= 0).toEqual(true);
    expect(xProfile.match(TWITTER_URL_REGEX)!.length >= 0).toEqual(true);
    expect(twitterProfile.match(TWITTER_URL_REGEX)!.length >= 0).toEqual(true);
    expect(noGood.match(TWITTER_URL_REGEX)).toEqual(null);
  });
});
