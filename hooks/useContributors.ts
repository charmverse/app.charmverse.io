import charmClient from 'charmClient';
import { Contributor } from 'models';
import { useEffect, useState } from 'react';
import { useCurrentSpace } from './useCurrentSpace';

export function useContributors () {
  const [space] = useCurrentSpace();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  useEffect(() => {
    if (space) {
      setContributors([]);
      charmClient.getContributors(space.id)
        .then(_contributors => {
          setContributors(_contributors);
        });
    }
  }, [space]);
  return [contributors, setContributors] as const;
}
