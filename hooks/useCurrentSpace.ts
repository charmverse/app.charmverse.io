/* eslint-disable no-console */
import type { Space } from '@prisma/client';
import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { useSpaces } from './useSpaces';

export function useCurrentSpace () {

  const router = useRouter();
  const [spaces, setSpaces] = useSpaces();

  // Support for extracting domain from logged in view or shared bounties view
  // The other part of this logic, which retrieves list of spaces in public mode is in components/share/PublicPage
  const domain = router.query.domain ?? router.query.pageId?.[0];

  const space = useMemo(() => {
    const newSpace = spaces.find(w => w.domain === domain);
    console.log('New space detected', newSpace?.domain);
    return newSpace;

  }, [domain, spaces]);

  const setSpace = useCallback((_space: Space) => {
    const newSpaces = spaces.map(s => s.id === _space.id ? _space : s);
    setSpaces(newSpaces);
  }, [spaces, setSpaces]);

  return [space, setSpace] as const;
}
