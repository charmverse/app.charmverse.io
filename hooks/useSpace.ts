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

  function setSpace (_space: Space | null, silent?: boolean) {
    if (_space) {
      const newSpaces = spaces.map(s => s.id === _space.id ? _space : s);
      if (silent) {
        const key = getKey('spaces');
        localStorage.setItem(key, JSON.stringify(newSpaces));
      }
      else {
        setSpaces(newSpaces);
      }
    }
    else {
      const spaceId = space!.id;
      console.log('dleete space', spaceId)
      const key = getKey('spaces');
      const newSpaces = spaces.filter(s => s.id !== spaceId);
      localStorage.setItem(key, JSON.stringify(newSpaces));
      localStorage.removeItem(`spaces.${spaceId}.pages`);
    }
  }

  return [space, setSpace] as const;
};
