import { useRouter } from 'next/router';
import { Space } from 'models';
import { useSpaces } from './useSpaces';
import { getKey } from './useLocalStorage';

export function useSpace () {

  const router = useRouter();
  const [spaces, setSpaces] = useSpaces();

  const { domain } = router.query;
  const space = spaces.find(w => w.domain === domain);
  if (!space) {
    throw new Error('Space not defined for domain: ' + domain);
  }

  function setSpace (space: Space, silent?: boolean) {
    const newSpaces = spaces.map(s => s.id === space.id ? space : s);
    if (silent) {
      const key = getKey('spaces');
      localStorage.setItem(key, JSON.stringify(newSpaces));
    }
    else {
      setSpaces(newSpaces);
    }
  }

  return [space, setSpace] as const;
};
