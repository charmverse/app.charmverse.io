import { getPostPath } from '../getPostPath';

describe('getPostPath', () => {
  it('should return a path as a lowercase, replacing consecutive whitespaces with a single underscore and appending random id', () => {
    const postTitle = 'Post   Title';
    const path = getPostPath(postTitle);
    expect(path).toMatch(/^post_title_[a-z0-9]{8}/);
  });
});
