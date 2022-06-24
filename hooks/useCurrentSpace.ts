import { useRouter } from 'next/router';
import { Space } from '@prisma/client';
import { useCallback, useMemo } from 'react';
import { useSpaces } from './useSpaces';

export function useCurrentSpace () {

  const router = useRouter();
  const [spaces, setSpaces] = useSpaces();

  const { domain } = router.query;
  const space = useMemo(() => spaces.find(w => w.domain === domain), [domain, spaces]);

  const setSpace = useCallback((_space: Space) => {
    const newSpaces = spaces.map(s => s.id === _space.id ? _space : s);
    setSpaces(newSpaces);
  }, [spaces, setSpaces]);

  return [space, setSpace] as const;
}
