import { decodeGithubUserId } from '../github/decodeGithubUserId';

describe('decodeGithubUserId', () => {
  it('decodes an old id format', () => {
    expect(decodeGithubUserId('MDQ6VXNlcjQxMjQxMTk0', 'author')).toEqual(41241194);
  });
  it('does not fail when given a new id format', () => {
    expect(decodeGithubUserId('U_kgDOBtmCgw', 'author')).toEqual(null);
  });
});
