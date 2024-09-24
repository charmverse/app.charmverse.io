'use client';

import { GET } from '@root/adapters/http';

export function searchBuilders(username: string) {
  return GET<[]>('/api/builders/search', {
    username
  });
}
