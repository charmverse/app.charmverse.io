import { useRouter } from 'next/router';
import { Space } from 'models';
import { useSpaces } from './useSpaces';

export function useCurrentSpace () {

  const router = useRouter();
  const [spaces, setSpaces] = useSpaces();

  const { domain } = router.query;
  const space = spaces.find(w => w.domain === domain);

  function setSpace (_space: Space) {
    const newSpaces = spaces.map(s => s.id === _space.id ? _space : s);
    setSpaces(newSpaces);
  }

  return [space, setSpace] as const;
}
