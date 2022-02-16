import { useEffect, useState } from 'react';
import { Contributor } from 'models';
import { users } from 'seedData';
import charmClient from 'charmClient';
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
