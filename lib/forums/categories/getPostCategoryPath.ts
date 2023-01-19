import { uid } from 'lib/utilities/strings';

const maxCategoryCharacters = 50;

// A future update can use https://www.npmjs.com/package/friendly-url

// Info for japanese title characters: https://gist.github.com/ryanmcgrath/982242

export function getPostCategoryPath(categoryName: string): string {
  const shortCategoryTitle = categoryName.slice(0, maxCategoryCharacters);

  const sanitisedCategoryTitle = shortCategoryTitle
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(
      /[^a-zA-Z\d\s\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u2605-\u2606\u2190-\u2195\u203B]{1,}/g,
      ' '
    )
    .trim()
    .replace(/\s{1,}/g, '_');

  if (sanitisedCategoryTitle.length < 3) {
    return `${sanitisedCategoryTitle}_${uid()}`;
  } else {
    return sanitisedCategoryTitle;
  }
}
