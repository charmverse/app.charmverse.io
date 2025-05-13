import { replaceS3Domain } from '../url';

describe('replaceS3Domain', () => {
  it('should not replace a dev bucket domain', () => {
    const testValue = 'https://s3.amazonaws.com/charm.public.dev/user-content/1234';

    expect(replaceS3Domain(testValue)).toBe(testValue);
  });

  it('should replace the prod bucket', () => {
    const testValue = 'https://s3.amazonaws.com/charm.public/user-content/1234';

    expect(replaceS3Domain(testValue)).toBe('https://cdn.charmverse.io/user-content/1234');
  });
});
