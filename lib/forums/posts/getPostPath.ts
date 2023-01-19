import { uid } from 'lib/utilities/strings';

const maxTitleCharacters = 50;

export function getPostPath(postTitle: string): string {
  const shortPostTitle =
    postTitle.length > maxTitleCharacters ? `${postTitle.slice(0, maxTitleCharacters)}` : postTitle;

  return `${shortPostTitle.toLowerCase().replace(/\s{1,}/g, '_')}_${uid()}`;
}
