import { randomId } from 'lib/utilities/random';

export function getPostPath(postTitle: string): string {
  return `${postTitle.toLowerCase().replace(/\s{1,}/g, '_')}_${randomId()}`;
}
