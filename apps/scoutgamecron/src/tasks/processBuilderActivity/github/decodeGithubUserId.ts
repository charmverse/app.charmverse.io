import { log } from '@charmverse/core/log';

// Examples: U_kgDOB-4rVA, U_kgDOBtmCgw, MDQ6VXNlcjQxMjQxMTk0
export function decodeGithubUserId(id: string, authorLogin: string): number | null {
  try {
    if (id.startsWith('U_')) {
      // this doesn't seem to work - TODO: maybe we shouldnt try to decode these?
      const decodedId = atob(id.slice(2));
      const match = decodedId.match(/(\d+)$/);
      if (match) {
        return parseInt(match[1], 10);
      }
      return null;
    }
    const parsedAuthorId = atob(id).split(':User').pop();
    if (!parsedAuthorId) {
      return null;
    }
    if (!Number.isNaN(parseInt(parsedAuthorId as string))) {
      return parseInt(parsedAuthorId as string);
    }
  } catch (e) {
    log.warn(`Could not decode GitHub user ID for ${authorLogin} with id ${id}`, {
      error: e
    });
  }
  return null;
}
