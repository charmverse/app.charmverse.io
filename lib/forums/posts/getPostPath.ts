import { uid } from 'lib/utilities/strings';

export function getPostPath(postTitle: string): string {
  return `${postTitle.toLowerCase().replace(/\s{1,}/g, '_')}_${uid()}`;
}
