import { stringToValidPath } from '@packages/utils/strings';

const maxCategoryCharacters = 50;

// A future update can use https://www.npmjs.com/package/friendly-url

// Info for japanese title characters: https://gist.github.com/ryanmcgrath/982242

export function getPostCategoryPath(categoryName: string): string {
  return stringToValidPath({ input: categoryName, maxLength: maxCategoryCharacters });
}
