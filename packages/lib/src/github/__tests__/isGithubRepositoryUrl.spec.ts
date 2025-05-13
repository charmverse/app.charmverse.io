import { isGithubRepositoryUrl } from '../isGithubRepositoryUrl';

describe('isGithubRepositoryUrl', () => {
  test('should return true for valid GitHub repository URLs', () => {
    const validUrls = [
      'https://github.com/user/repo',
      'https://github.com/charmverse/app.charmverse.io',
      'https://github.com/username123/repo-name',
      'https://github.com/user-name/repo_name'
    ];

    validUrls.forEach((url) => {
      expect(isGithubRepositoryUrl(url)).toBe(true);
    });
  });

  test('should return false for invalid GitHub repository URLs', () => {
    const invalidUrls = [
      'https://github.com/user',
      'https://github.com/user/',
      'https://github.com/user/repo/extra',
      'https://github.com//repo',
      'https://github.com/user/repo?query=param',
      'https://github.com/user/repo#fragment',
      'https://github.com/username//repo'
    ];

    invalidUrls.forEach((url) => {
      expect(isGithubRepositoryUrl(url)).toBe(false);
    });
  });
});
