const BOUNTIES_PATH = '/[domain]/bounties';
const PUBLIC_PAGE_PATHS = [BOUNTIES_PATH, '/[domain]/[pageId]'];

export function isPublicPagePath(path: string): boolean {
  return PUBLIC_PAGE_PATHS.includes(path);
}

export function isBountiesPagePath(path: string): boolean {
  return path === BOUNTIES_PATH;
}
