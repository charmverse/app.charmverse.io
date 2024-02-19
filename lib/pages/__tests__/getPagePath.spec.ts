import { generatePagePathFromPathAndTitle, getPagePath } from '../utils';

describe('getPathPath', () => {
  it('should return a string with random numbers', () => {
    const pagePath = getPagePath();

    expect(pagePath).toMatch(/page-\d{12,}/);
  });
});

describe('generatePagePathFromExistingPath', () => {
  it('should generate a path for a new title', () => {
    const newPageTitle = 'Team Tortilla Tournament';

    const generatedPath = generatePagePathFromPathAndTitle({
      title: newPageTitle
    });
    expect(generatedPath).toMatch(/^team-tortilla-tournament-/);
  });

  it('should generate an updated page path with the same number suffix, and a URL-safe title', () => {
    const pagePath = 'page-987654321120';

    const newPageTitle = 'Team Tortilla Tournament';

    const generatedPath = generatePagePathFromPathAndTitle({
      existingPagePath: pagePath,
      title: newPageTitle
    });

    expect(generatedPath).toEqual('team-tortilla-tournament-987654321120');

    const secondNewPageTitle = 'Absolutely   Amazing Alliteration   ';

    const secondGeneratedPath = generatePagePathFromPathAndTitle({
      existingPagePath: generatedPath,
      title: secondNewPageTitle
    });

    expect(secondGeneratedPath).toEqual('absolutely-amazing-alliteration-987654321120');

    const thirdNewPageTitle = 'a';

    const thirdGeneratedPath = generatePagePathFromPathAndTitle({
      existingPagePath: generatedPath,
      title: thirdNewPageTitle
    });

    expect(thirdGeneratedPath).toEqual('a-987654321120');
  });
});
