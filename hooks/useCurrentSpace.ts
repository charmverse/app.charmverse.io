import { useRouter } from 'next/router';
import { Page, Space } from 'models';
import { useSpaces } from './useSpaces';
import { getStorageValue, setStorageValue } from './useLocalStorage';

export function useCurrentSpace () {

  const router = useRouter();
  const [spaces, setSpaces] = useSpaces();

  const { domain } = router.query;
  const space = spaces.find(w => w.domain === domain);

  function setSpace (_space: Space | null, silent?: boolean) {
    if (_space) {
      const newSpaces = spaces.map(s => s.id === _space.id ? _space : s);
      if (silent) {
        setStorageValue('spaces', newSpaces);
      }
      else {
        setSpaces(newSpaces);
      }
    }
    else {
      // delete the current space
      const spaceId = space!.id;
      const newSpaces = spaces.filter(s => s.id !== spaceId);
      setStorageValue('spaces', newSpaces);
      // delete pages
      const pages = getStorageValue<Page[]>('pages', []);
      setStorageValue('pages', pages.filter(p => p.spaceId !== spaceId));
    }
  }

  return [space, setSpace] as const;
}
