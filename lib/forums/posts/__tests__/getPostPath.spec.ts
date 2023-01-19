import { getPostPath } from '../getPostPath';

describe('getPostPath', () => {
  it('should return a path as a lowercase, replacing consecutive whitespaces with a single underscore and appending random id', () => {
    const postTitle = 'Post   Title';
    const path = getPostPath(postTitle);
    expect(path).toMatch(/^post_title_[a-z0-9]{8}/);
  });

  it('should not exceed 60 characters, including the random ID at the end', () => {
    // This number is also defined in getPostPath lib, but defined independently here as a failsafe
    const maxchars = 60;

    let title = '';

    for (let i = 0; i < 100; i++) {
      title += 'a';
    }

    const path = getPostPath(title);
    expect(path.length < maxchars).toBe(true);
  });
});
