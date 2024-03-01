import { stringToValidPath, uid } from 'lib/utils/strings';

const maxTitleCharacters = 50;

export function getPostPath(postTitle: string): string {
  return `${stringToValidPath({ input: postTitle, maxLength: maxTitleCharacters })}_${uid()}`;
}
