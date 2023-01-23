import { stringToValidPath, uid } from 'lib/utilities/strings';

const maxTitleCharacters = 50;

export function getPostPath(postTitle: string): string {
  return `${stringToValidPath(postTitle, maxTitleCharacters)}_${uid()}`;
}
