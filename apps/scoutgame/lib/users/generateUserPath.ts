import { v4 } from 'uuid';

import { getUserByPath } from './getUserByPath';

export async function generateUserPath(displayName: string) {
  const path = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  const existingUser = await getUserByPath(path);
  if (existingUser) {
    return `${path}-${v4().split('-')[0]}`;
  }
  return path;
}
