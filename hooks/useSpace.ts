import { useRouter } from 'next/router';
import { Space } from 'models';
import { useSpaces } from './useSpaces';

export function useSpace () {

  const router = useRouter();
  const [spaces, setSpaces] = useSpaces();

  const { domain } = router.query;
  const space = spaces.find(w => w.domain === domain);
  if (!space) {
    throw new Error('Space not defined for domain: ' + domain);
  }

  function setSpace (space: Space) {
    const newSpaces = spaces.map(s => s.domain === space.domain ? space : s);
    setSpaces(newSpaces);
  }

  return [space, setSpace] as const;
};